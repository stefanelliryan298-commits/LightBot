const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('⏹️ Ferma la musica e disconnetti il bot'),

    async execute(interaction) {
        const { guild, client } = interaction;
        const queue = client.queues.get(guild.id);
        
        if (!queue) {
            return interaction.reply({ 
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription('❌ Nessuna musica in riproduzione!')
                ],
                ephemeral: true 
            });
        }

        queue.destroy();
        client.queues.delete(guild.id);
        
        interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription('⏹️ Riproduzione fermata e bot disconnesso!')
            ]
        });
    }
};
