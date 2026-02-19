// utils/db.js
const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'servers.json');

// Assicura che la cartella data/ esista
function ensureFile() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir))  fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, '{}', 'utf-8');
}

// Legge tutto il DB
function readAll() {
    ensureFile();
    try {
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    } catch {
        return {};
    }
}

// Scrive tutto il DB
function writeAll(data) {
    ensureFile();
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Ritorna i dati di un server (crea il record se non esiste)
function getServer(guildId) {
    const all = readAll();
    if (!all[guildId]) all[guildId] = {};
    return all[guildId];
}

// Salva i dati di un server
function setServer(guildId, data) {
    const all = readAll();
    all[guildId] = data;
    writeAll(all);
}

// Elimina i dati di un server
function deleteServer(guildId) {
    const all = readAll();
    delete all[guildId];
    writeAll(all);
}

module.exports = { getServer, setServer, deleteServer };
