const mongoose = require('mongoose');

const muteSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    moderatorId: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'voice', 'both'],
        default: 'both'
    },
    duration: String,
    expiresAt: Date,
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

muteSchema.index({ guildId: 1, userId: 1 });

module.exports = mongoose.model('Mute', muteSchema);
