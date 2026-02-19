// models/ServerConfig.js
const { Schema, model, models } = require('mongoose');

const partnerSchema = new Schema({
    title:       { type: String, required: false },
    description: { type: String, default: '' },
    link:        { type: String, default: null },
    manager:     { type: String, default: null },  // tag utente
    author:      { type: String, required: true },  // tag di chi ha inviato
    addedAt:     { type: Date,   default: Date.now }
}, { _id: true });

const serverConfigSchema = new Schema({
    guildId:         { type: String, required: true, unique: true },

    // Partnership
    partnerChannel:  { type: String, default: null },
    pingRole:        { type: String, default: null },
    pingType:        { type: String, enum: ['none', 'here', 'everyone'], default: 'none' },
    memberThreshold: { type: Number, default: null },
    managerRole:     { type: String, default: null },
    partners:        { type: [partnerSchema], default: [] },

}, { timestamps: true });

// Evita errore "Cannot overwrite model" al riavvio in sviluppo
module.exports = models.ServerConfig || model('ServerConfig', serverConfigSchema);