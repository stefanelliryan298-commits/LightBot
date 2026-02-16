const mongoose = require('mongoose');

const userStatsSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    username: String,
    messages: {
        type: Number,
        default: 0
    },
    voiceMinutes: {
        type: Number,
        default: 0
    },
    joins: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    },
    xp: {
        type: Number,
        default: 0
    },
    warnings: {
        type: Number,
        default: 0
    },
    lastMessageAt: Date,
    lastVoiceJoinAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

userStatsSchema.index({ guildId: 1, userId: 1 }, { unique: true });
userStatsSchema.index({ guildId: 1, xp: -1 });

module.exports = mongoose.model('UserStats', userStatsSchema);
