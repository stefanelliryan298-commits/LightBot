const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createMusicEmbed, createControlButtons } = require('../../utils/musicUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('🎵 Mostra la canzone in riproduzione'),

    async execute(interaction) {
        const { guild, client } = interaction;
        const queue = client.queues.get(guild.id);
        
        if (!queue || !queue.currentSong) {
            return interaction.reply({ 
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription('❌ Nessuna musica in riproduzione!')
                ],
                ephemeral: true 
            });
        }

        const embed = createMusicEmbed(queue.currentSong, 'playing');
        const buttons = createControlButtons(queue);
        
        embed.addFields(
            { name: '🔊 Volume', value: `${queue.volume}%`, inline: true },
            { 
                name: '🔁 Loop', 
                value: queue.loop === 'off' ? 'Off' : queue.loop === 'song' ? '🔂 Canzone' : '🔁 Coda', 
                inline: true 
            },
            { name: '📋 In Coda', value: `${queue.songs.length - 1} canzoni`, inline: true }
        );

        interaction.reply({ embeds: [embed], components: [buttons] });
    }
};
