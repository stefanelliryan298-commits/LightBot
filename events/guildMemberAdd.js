// events/guildMemberAdd.js
const { Events } = require('discord.js');
const UserStats = require('../models/UserStats');
const ProtectionConfig = require('../models/ProtectionConfig');

// Map<guildId, { joins: [timestamp], alerted: boolean }>
const raidTracker = new Map();

module.exports = {
    name: Events.GuildMemberAdd,

    async execute(member) {
        // ────────────────────────────────────────────────────────────────────
        // 1. STATISTICHE UTENTE (Join tracking)
        // ────────────────────────────────────────────────────────────────────
        try {
            let userStats = await UserStats.findOne({
                guildId: member.guild.id,
                userId: member.id
            });

            if (!userStats) {
                userStats = new UserStats({
                    guildId: member.guild.id,
                    userId: member.id,
                    username: member.user.username
                });
            }

            userStats.joins += 1;
            userStats.username = member.user.username;

            await userStats.save();
        } catch (error) {
            console.error('Errore nel tracciamento dei join:', error);
        }

        // ────────────────────────────────────────────────────────────────────
        // 2. ANTI-RAID
        // ────────────────────────────────────────────────────────────────────
        const cfg = await ProtectionConfig.findOne({ guildId: member.guild.id });
        if (!cfg?.antiraid?.enabled) return;

        const ar      = cfg.antiraid;
        const guildId = member.guild.id;
        const now     = Date.now();
        const window  = ar.timeWindow * 1000;

        if (!raidTracker.has(guildId)) raidTracker.set(guildId, { joins: [], alerted: false });
        const tracker = raidTracker.get(guildId);

        // Rimuovi join fuori dalla finestra temporale
        tracker.joins = tracker.joins.filter(t => now - t < window);
        tracker.joins.push(now);

        // Non ancora sopra soglia
        if (tracker.joins.length < ar.joinThreshold) return;

        // RAID RILEVATO
        console.warn(`[ANTI-RAID] Raid rilevato in ${member.guild.name} — ${tracker.joins.length} join in ${ar.timeWindow}s`);

        // Svuota tracker per evitare azioni ripetute ogni join successivo
        tracker.joins   = [];
        tracker.alerted = true;

        // Recupera tutti i membri entrati di recente
        const recentMembers = member.guild.members.cache.filter(m => {
            if (!m.joinedTimestamp) return false;
            return now - m.joinedTimestamp < window && !m.user.bot;
        });

        for (const [, raider] of recentMembers) {
            try {
                if (ar.action === 'ban') {
                    await raider.ban({ reason: 'Anti-Raid: join sospetto massivo' });
                } else if (ar.action === 'kick') {
                    await raider.kick('Anti-Raid: join sospetto massivo');
                } else if (ar.action === 'timeout') {
                    await raider.timeout(60 * 60 * 1000, 'Anti-Raid: join sospetto massivo');
                }
            } catch (_) {
                // ignora se non si può agire sull'utente
            }
        }
    },

    // Permette il reset via comando /antiraid reset
    resetGuild(guildId) {
        raidTracker.delete(guildId);
    }
};