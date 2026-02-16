const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('▶️ Riprendi la riproduzione'),

    async execute(interaction) {
        const { guild, client } = interaction;
        const queue = client.queues.get(guild.id);
        
        if (!queue) {
            return interaction.reply({ 
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription('❌ Nessuna musica in coda!')
                ],
                ephemeral: true 
            });
        }

        if (queue.playing) {
            return interaction.reply({ 
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription('❌ La musica è già in riproduzione!')
                ],
                ephemeral: true 
            });
        }

        queue.player.unpause();
        queue.playing = true;
        
        interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setDescription('▶️ Riproduzione ripresa!')
            ]
        });
    }
};
