const Guild = require('../models/Guild');
const { translations } = require('./translations');

/**
 * Ottiene la lingua configurata per un server
 * @param {string} guildId - ID del server
 * @returns {Promise<string>} Codice lingua (es. 'it', 'en')
 */
async function getGuildLanguage(guildId) {
    try {
        const guildConfig = await Guild.findOne({ guildId });
        return guildConfig?.language || 'it'; // Default italiano
    } catch (error) {
        console.error('Errore nel recupero della lingua:', error);
        return 'it';
    }
}

/**
 * Ottiene il testo tradotto per una chiave specifica
 * @param {string} guildId - ID del server
 * @param {string} key - Chiave della traduzione (es. 'commands.help.description')
 * @returns {Promise<string>} Testo tradotto
 */
async function translate(guildId, key) {
    const lang = await getGuildLanguage(guildId);
    const keys = key.split('.');
    
    let value = translations[lang];
    for (const k of keys) {
        value = value?.[k];
        if (!value) break;
    }
    
    // Fallback all'inglese se la traduzione non esiste
    if (!value) {
        value = translations['en'];
        for (const k of keys) {
            value = value?.[k];
            if (!value) break;
        }
    }
    
    return value || key;
}

/**
 * Ottiene tutte le traduzioni per un server
 * @param {string} guildId - ID del server
 * @returns {Promise<object>} Oggetto con tutte le traduzioni
 */
async function getTranslations(guildId) {
    const lang = await getGuildLanguage(guildId);
    return translations[lang] || translations['it'];
}

module.exports = { getGuildLanguage, translate, getTranslations };