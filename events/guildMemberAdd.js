const { Events } = require('discord.js');
const UserStats = require('../models/UserStats');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        try {
            // Trova o crea le statistiche dell'utente
            let userStats = await UserStats.findOne({
                guildId: member.guild.id,
                userId: member.id
            });

            if (!userStats) {
                userStats = new UserStats({
                    guildId: member.guild.id,
                    userId: member.id,
                    username: member.user.username
                });
            }

            userStats.joins += 1;
            userStats.username = member.user.username;

            await userStats.save();
        } catch (error) {
            console.error('Errore nel tracciamento dei join:', error);
        }
    },
};
