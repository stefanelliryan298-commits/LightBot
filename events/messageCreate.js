const { Events } = require('discord.js');
const UserStats = require('../models/UserStats');
const Utils = require('../utils/helpers');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        // Ignora bot e messaggi DM
        if (message.author.bot || !message.guild) return;

        try {
            // Trova o crea le statistiche dell'utente
            let userStats = await UserStats.findOne({
                guildId: message.guild.id,
                userId: message.author.id
            });

            if (!userStats) {
                userStats = new UserStats({
                    guildId: message.guild.id,
                    userId: message.author.id,
                    username: message.author.username
                });
            }

            // Aggiorna statistiche
            userStats.messages += 1;
            userStats.username = message.author.username;
            userStats.lastMessageAt = new Date();

            // Sistema XP e livelli
            const xpGain = Utils.generateMessageXP();
            userStats.xp += xpGain;

            const newLevel = Utils.calculateLevel(userStats.xp);
            
            // Se l'utente ha salito di livello
            if (newLevel > userStats.level) {
                userStats.level = newLevel;
                
                // Messaggio di level up (opzionale)
                message.reply(`🎉 Congratulazioni ${message.author}! Sei salito al livello **${newLevel}**!`)
                    .then(msg => setTimeout(() => msg.delete(), 5000))
                    .catch(() => {});
            }

            await userStats.save();
        } catch (error) {
            console.error('Errore nel tracciamento delle statistiche:', error);
        }
    },
};
