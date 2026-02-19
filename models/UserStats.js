// models/UserStats.js
const { Schema, model, models } = require('mongoose');

const gemSchema = new Schema({
    name:     { type: String, required: true },
    rarity:   { type: String, enum: ['comune', 'non_comune', 'rara', 'epica', 'leggendaria', 'mitica'], required: true },
    obtainedAt: { type: Date, default: Date.now }
}, { _id: true });

const userStatsSchema = new Schema({
    userId:   { type: String, required: true },
    guildId:  { type: String, required: true },

    // Economia
    cookies:       { type: Number, default: 0 },
    streak:        { type: Number, default: 0 },
    lastDaily:     { type: Date,   default: null },

    // Gemme
    gems:          { type: [gemSchema], default: [] },

    // Lootbox
    lootboxOpened: { type: Number, default: 0 },

    // Moderazione
    warns: {
        type: [{
            reason:    { type: String, default: 'Nessun motivo' },
            moderator: { type: String },  // tag mod
            createdAt: { type: Date, default: Date.now }
        }],
        default: []
    },

}, { timestamps: true });

// Indice composto: un record per utente per server
userStatsSchema.index({ userId: 1, guildId: 1 }, { unique: true });

module.exports = models.UserStats || model('UserStats', userStatsSchema);
