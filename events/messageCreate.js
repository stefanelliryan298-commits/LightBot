// events/messageCreate.js
const { Events } = require('discord.js');
const UserStats = require('../models/UserStats');
const Utils = require('../utils/helpers');
const ProtectionConfig = require('../models/ProtectionConfig');

// ── IN-MEMORY TRACKERS ────────────────────────────────────────────────────────
// Map<guildId, Map<userId, { count, firstMsg }>>
const spamTracker = new Map();

// Regex per rilevare invite Discord
const DISCORD_INVITE_REGEX = /discord(?:\.gg|app\.com\/invite|\.com\/invite)\/[\w-]+/i;

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
    name: Events.MessageCreate,

    async execute(message, client) {
        // Ignora bot e messaggi DM
        if (message.author.bot || !message.guild) return;

        // ────────────────────────────────────────────────────────────────────
        // 1. STATISTICHE UTENTE (XP & Livelli)
        // ────────────────────────────────────────────────────────────────────
        try {
            let userStats = await UserStats.findOne({
                guildId: message.guild.id,
                userId: message.author.id
            });

            if (!userStats) {
                userStats = new UserStats({
                    guildId: message.guild.id,
                    userId: message.author.id,
                    username: message.author.username
                });
            }

            userStats.messages += 1;
            userStats.username = message.author.username;
            userStats.lastMessageAt = new Date();

            const xpGain = Utils.generateMessageXP();
            userStats.xp += xpGain;

            const newLevel = Utils.calculateLevel(userStats.xp);

            if (newLevel > userStats.level) {
                userStats.level = newLevel;
                message.reply(`🎉 Congratulazioni ${message.author}! Sei salito al livello **${newLevel}**!`)
                    .then(msg => setTimeout(() => msg.delete(), 5000))
                    .catch(() => {});
            }

            await userStats.save();
        } catch (error) {
            console.error('Errore nel tracciamento delle statistiche:', error);
        }

        // ────────────────────────────────────────────────────────────────────
        // 2. PROTEZIONI (Anti-Spam & Anti-Link)
        // ────────────────────────────────────────────────────────────────────
        const cfg = await ProtectionConfig.findOne({ guildId: message.guild.id });
        if (!cfg) return;

        if (cfg.antispam.enabled) {
            await handleAntiSpam(message, cfg);
        }

        if (cfg.antilink.enabled) {
            await handleAntiLink(message, cfg);
        }
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// ANTI-SPAM HANDLER
// ─────────────────────────────────────────────────────────────────────────────
async function handleAntiSpam(message, cfg) {
    const guildId = message.guild.id;
    const userId  = message.author.id;
    const limit   = cfg.antispam.limit; // msg al minuto
    const window  = 60_000; // 1 minuto in ms

    if (!spamTracker.has(guildId)) spamTracker.set(guildId, new Map());
    const guildMap = spamTracker.get(guildId);

    const now  = Date.now();
    const data = guildMap.get(userId) || { count: 0, firstMsg: now };

    // Reset se fuori finestra
    if (now - data.firstMsg > window) {
        data.count    = 1;
        data.firstMsg = now;
    } else {
        data.count++;
    }

    guildMap.set(userId, data);

    if (data.count > limit) {
        const member = message.guild.members.cache.get(userId);
        if (!member) return;

        await message.delete().catch(() => {});

        const muteDuration = 5 * 60 * 1000; // 5 minuti
        await member.timeout(muteDuration, 'Anti-Spam: troppi messaggi').catch(() => {});

        guildMap.delete(userId);

        await message.author.send({
            content: [
                `⚠️ **[${message.guild.name}] Avviso Anti-Spam**`,
                `Sei stato mutato per **5 minuti** per aver inviato troppi messaggi in poco tempo.`,
                `Limite: ${limit} messaggi/minuto.`,
            ].join('\n')
        }).catch(() => {});
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ANTI-LINK HANDLER
// ─────────────────────────────────────────────────────────────────────────────
async function handleAntiLink(message, cfg) {
    const al = cfg.antilink;

    // Canale in whitelist? → ignora
    if (al.whitelistChannels.includes(message.channel.id)) return;

    // Il messaggio contiene un invite Discord?
    if (!DISCORD_INVITE_REGEX.test(message.content)) return;

    // Elimina subito il messaggio
    await message.delete().catch(() => {});

    const userId = message.author.id;

    // Recupera o crea record violazione
    let violation = al.violations.find(v => v.userId === userId);
    if (!violation) {
        violation = { userId, count: 0, mutedUntil: null };
        al.violations.push(violation);
    }

    // Se era mutato e il timeout è scaduto, resetta
    if (violation.mutedUntil && new Date() > violation.mutedUntil) {
        violation.count      = 0;
        violation.mutedUntil = null;
    }

    violation.count++;
    cfg.markModified('antilink');
    await cfg.save();

    const remainingWarns = 3 - violation.count;

    // ── DM di avviso ─────────────────────────────────────────────────────────
    if (violation.count < 3) {
        await message.author.send({
            content: [
                `⚠️ **[${message.guild.name}] Avviso Anti-Link**`,
                ``,
                `Hai inviato un link a un server Discord in <#${message.channel.id}>.`,
                `I link Discord non sono consentiti in questo canale.`,
                ``,
                `⚠️ **Avvertimento ${violation.count}/3** — Alla terza violazione verrai mutato per **10 minuti**.`,
                remainingWarns > 0 ? `Ti restano **${remainingWarns}** avvertimento/i prima del mute.` : '',
            ].join('\n')
        }).catch(() => {});
    }

    // ── Alla 3ª violazione: mute 10 minuti ───────────────────────────────────
    if (violation.count >= 3) {
        const member = message.guild.members.cache.get(userId);
        if (!member) return;

        const muteDuration   = 10 * 60 * 1000; // 10 minuti
        violation.mutedUntil = new Date(Date.now() + muteDuration);
        violation.count      = 0; // reset dopo il mute
        cfg.markModified('antilink');
        await cfg.save();

        await member.timeout(muteDuration, 'Anti-Link: spam di link Discord').catch(() => {});

        await message.author.send({
            content: [
                `🔇 **[${message.guild.name}] Sei stato mutato**`,
                ``,
                `Hai raggiunto il limite di **3 violazioni** per l'invio di link Discord.`,
                `Sei stato mutato per **10 minuti**.`,
                ``,
                `Rispetta le regole del server per evitare sanzioni più severe.`,
            ].join('\n')
        }).catch(() => {});
    }
}