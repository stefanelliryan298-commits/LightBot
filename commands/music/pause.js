const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('⏸️ Metti in pausa la riproduzione'),

    async execute(interaction) {
        const { guild, client } = interaction;
        const queue = client.queues.get(guild.id);
        
        if (!queue || !queue.playing) {
            return interaction.reply({ 
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription('❌ Nessuna musica in riproduzione!')
                ],
                ephemeral: true 
            });
        }

        queue.player.pause();
        queue.playing = false;
        
        interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xFFAA00)
                    .setDescription('⏸️ Riproduzione in pausa')
            ]
        });
    }
};
