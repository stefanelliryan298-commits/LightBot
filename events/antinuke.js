// events/antinuke.js
//
// Registra i seguenti eventi:
//   guildBanAdd, guildMemberRemove (kick), channelDelete, roleDelete
//
// Per usarlo nel tuo index.js / event loader, puoi importarlo come modulo
// multi-evento oppure registrare manualmente i quattro listener.
//
// Esempio nel tuo client ready / index.js:
//   const antinuke = require('./events/antinuke');
//   antinuke.register(client);

const ProtectionConfig = require('../models/ProtectionConfig');

// Map<guildId, Map<userId, { bans, kicks, channelDeletes, roleDeletes, firstAction }>>
const nukeTracker = new Map();

function getTracker(guildId, userId) {
    if (!nukeTracker.has(guildId)) nukeTracker.set(guildId, new Map());
    const gMap = nukeTracker.get(guildId);
    if (!gMap.has(userId)) gMap.set(userId, { bans: 0, kicks: 0, channelDeletes: 0, roleDeletes: 0, firstAction: Date.now() });
    return gMap.get(userId);
}

function resetTracker(guildId, userId) {
    nukeTracker.get(guildId)?.delete(userId);
}

async function checkAndAct(guild, userId, cfg, type) {
    const an      = cfg.antinuke;
    const window  = an.timeWindow * 1000;
    const tracker = getTracker(guild.id, userId);
    const now     = Date.now();

    // Reset se fuori finestra
    if (now - tracker.firstAction > window) {
        resetTracker(guild.id, userId);
        const fresh = getTracker(guild.id, userId);
        fresh.firstAction = now;
        fresh[type]++;
        return;
    }

    tracker[type]++;

    const triggered =
        tracker.bans          >= an.banLimit     ||
        tracker.kicks         >= an.kickLimit     ||
        tracker.channelDeletes >= an.channelLimit ||
        tracker.roleDeletes   >= an.roleLimit;

    if (!triggered) return;

    // Evita azione doppia
    resetTracker(guild.id, userId);

    // Non agire sull'owner o sulla whitelist
    if (userId === guild.ownerId) return;
    if (an.whitelist.includes(userId)) return;

    const member = guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
    if (!member) return;

    console.warn(`[ANTI-NUKE] Azione rilevata in ${guild.name} da ${userId} (tipo: ${type})`);

    try {
        if (an.action === 'ban') {
            await guild.bans.create(userId, { reason: `Anti-Nuke: attività sospetta (${type})` });
        } else if (an.action === 'kick') {
            await member.kick(`Anti-Nuke: attività sospetta (${type})`);
        } else if (an.action === 'strip') {
            // Rimuovi tutti i ruoli gestibili
            const roles = member.roles.cache.filter(r => r.editable && r.id !== guild.id);
            await member.roles.remove(roles, `Anti-Nuke: strip ruoli (${type})`);
        }
    } catch (err) {
        console.error('[ANTI-NUKE] Impossibile agire sul membro:', err.message);
    }
}

module.exports = {
    register(client) {

        // ── BAN ──────────────────────────────────────────────────────────────
        client.on('guildBanAdd', async (ban) => {
            if (!ban.guild) return;
            const cfg = await ProtectionConfig.findOne({ guildId: ban.guild.id });
            if (!cfg?.antinuke?.enabled) return;

            // Trova chi ha eseguito il ban dai log audit
            const logs = await ban.guild.fetchAuditLogs({ type: 22 /* BAN_MEMBER */, limit: 1 }).catch(() => null);
            const executor = logs?.entries.first()?.executor;
            if (!executor || executor.bot) return;

            await checkAndAct(ban.guild, executor.id, cfg, 'bans');
        });

        // ── KICK (guildMemberRemove) ──────────────────────────────────────────
        client.on('guildMemberRemove', async (member) => {
            const cfg = await ProtectionConfig.findOne({ guildId: member.guild.id });
            if (!cfg?.antinuke?.enabled) return;

            const logs = await member.guild.fetchAuditLogs({ type: 20 /* KICK_MEMBER */, limit: 1 }).catch(() => null);
            const entry = logs?.entries.first();
            if (!entry || entry.target?.id !== member.id) return;
            if (entry.executor?.bot) return;

            // Controlla che sia recente (max 3s)
            if (Date.now() - entry.createdTimestamp > 3000) return;

            await checkAndAct(member.guild, entry.executor.id, cfg, 'kicks');
        });

        // ── CHANNEL DELETE ────────────────────────────────────────────────────
        client.on('channelDelete', async (channel) => {
            if (!channel.guild) return;
            const cfg = await ProtectionConfig.findOne({ guildId: channel.guild.id });
            if (!cfg?.antinuke?.enabled) return;

            const logs = await channel.guild.fetchAuditLogs({ type: 12 /* CHANNEL_DELETE */, limit: 1 }).catch(() => null);
            const executor = logs?.entries.first()?.executor;
            if (!executor || executor.bot) return;

            await checkAndAct(channel.guild, executor.id, cfg, 'channelDeletes');
        });

        // ── ROLE DELETE ───────────────────────────────────────────────────────
        client.on('roleDelete', async (role) => {
            const cfg = await ProtectionConfig.findOne({ guildId: role.guild.id });
            if (!cfg?.antinuke?.enabled) return;

            const logs = await role.guild.fetchAuditLogs({ type: 32 /* ROLE_DELETE */, limit: 1 }).catch(() => null);
            const executor = logs?.entries.first()?.executor;
            if (!executor || executor.bot) return;

            await checkAndAct(role.guild, executor.id, cfg, 'roleDeletes');
        });

        console.log('[ANTI-NUKE] Event listeners registrati.');
    }
};