const ms = require('ms');
const Guild = require('../models/Guild');

class Utils {
    /**
     * Converte una stringa tempo in millisecondi
     */
    static parseDuration(duration) {
        return ms(duration);
    }

    /**
     * Formatta una durata in formato leggibile
     */
    static formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} giorni`;
        if (hours > 0) return `${hours} ore`;
        if (minutes > 0) return `${minutes} minuti`;
        return `${seconds} secondi`;
    }

    /**
     * Verifica se un utente ha un ruolo VIP
     */
    static async isVIP(member, guildId) {
        const guildConfig = await Guild.findOne({ guildId });
        if (!guildConfig || !guildConfig.vipRoles || guildConfig.vipRoles.length === 0) {
            return false;
        }

        return member.roles.cache.some(role => guildConfig.vipRoles.includes(role.id));
    }

    /**
     * Ottiene o crea la configurazione del server
     */
    static async getGuildConfig(guildId) {
        let config = await Guild.findOne({ guildId });
        
        if (!config) {
            config = new Guild({ guildId });
            await config.save();
        }

        return config;
    }

    /**
     * Crea o ottiene il ruolo muted
     */
    static async getMutedRole(guild) {
        let mutedRole = guild.roles.cache.find(role => role.name === 'Muted');

        if (!mutedRole) {
            mutedRole = await guild.roles.create({
                name: 'Muted',
                color: '#818386',
                permissions: [],
                reason: 'Ruolo per utenti silenziati'
            });

            // Applica le restrizioni a tutti i canali
            guild.channels.cache.forEach(async channel => {
                await channel.permissionOverwrites.create(mutedRole, {
                    SendMessages: false,
                    AddReactions: false,
                    Speak: false,
                    Connect: false
                });
            });
        }

        return mutedRole;
    }

    /**
     * Calcola il livello in base all'XP
     */
    static calculateLevel(xp) {
        return Math.floor(0.1 * Math.sqrt(xp));
    }

    /**
     * Calcola l'XP necessario per il prossimo livello
     */
    static calculateRequiredXP(level) {
        return Math.pow((level + 1) / 0.1, 2);
    }

    /**
     * Genera XP random per un messaggio
     */
    static generateMessageXP() {
        return Math.floor(Math.random() * 15) + 10; // 10-25 XP
    }

    /**
     * Formatta un messaggio con placeholder
     */
    static formatMessage(message, data) {
        let formatted = message;
        for (const [key, value] of Object.entries(data)) {
            formatted = formatted.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        }
        return formatted;
    }

    /**
     * Controlla se un utente ha i permessi necessari
     */
    static hasPermission(member, permission) {
        return member.permissions.has(permission);
    }

    /**
     * Invia un log in un canale specifico
     */
    static async sendLog(guild, embed) {
        const guildConfig = await this.getGuildConfig(guild.id);
        
        if (!guildConfig.logChannelId) return;

        const logChannel = guild.channels.cache.get(guildConfig.logChannelId);
        if (logChannel) {
            await logChannel.send({ embeds: [embed] });
        }
    }

    /**
     * Tronca un testo se è troppo lungo
     */
    static truncate(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }
}

module.exports = Utils;
