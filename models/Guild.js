const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    language: {
        type: String,
        default: 'en'
    },
    lockedChannels: [{
        channelId: String,
        lockedUntil: Date,
        lockedBy: String
    }],
    mutedRoleId: String,
    logChannelId: String,
    vipRoles: [String],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Guild', guildSchema);
