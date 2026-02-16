const mongoose = require('mongoose');

const banSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    username: String,
    moderatorId: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
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

banSchema.index({ guildId: 1, userId: 1 });

module.exports = mongoose.model('Ban', banSchema);
