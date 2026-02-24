// models/ProtectionConfig.js
const mongoose = require('mongoose');

const protectionConfigSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },

    // ── ANTI-SPAM ─────────────────────────────────────────────────────────────
    antispam: {
        enabled:  { type: Boolean, default: false },
        limit:    { type: Number,  default: 30 },   // messaggi al minuto
    },

    // ── ANTI-NUKE ─────────────────────────────────────────────────────────────
    antinuke: {
        enabled:        { type: Boolean, default: false },
        banLimit:       { type: Number,  default: 5  },  // ban in X secondi
        kickLimit:      { type: Number,  default: 5  },
        channelLimit:   { type: Number,  default: 3  },  // canali eliminati
        roleLimit:      { type: Number,  default: 3  },
        timeWindow:     { type: Number,  default: 10 },  // secondi
        action:         { type: String,  default: 'ban', enum: ['ban', 'kick', 'strip'] },
        whitelist:      { type: [String], default: [] }, // user IDs
    },

    // ── ANTI-RAID ─────────────────────────────────────────────────────────────
    antiraid: {
        enabled:        { type: Boolean, default: false },
        joinThreshold:  { type: Number,  default: 10 }, // join in X secondi
        timeWindow:     { type: Number,  default: 10 },
        action:         { type: String,  default: 'kick', enum: ['kick', 'ban', 'timeout'] },
        lockdown:       { type: Boolean, default: false },
    },

    // ── ANTI-LINK ─────────────────────────────────────────────────────────────
    antilink: {
        enabled:         { type: Boolean, default: false },
        whitelistChannels: { type: [String], default: [] }, // canali esenti
        // Map userId -> { count, mutedUntil }  (salvata come array per Mongo)
        violations: [{
            userId:     String,
            count:      { type: Number, default: 0 },
            mutedUntil: { type: Date,   default: null },
        }],
    },

    // ── SUGGESTION ────────────────────────────────────────────────────────────
    suggestion: {
        channelId: { type: String, default: null },
    },
}, { timestamps: true });

module.exports = mongoose.models.ProtectionConfig
    || mongoose.model('ProtectionConfig', protectionConfigSchema);
