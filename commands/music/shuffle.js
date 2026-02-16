const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('🔀 Mescola la coda casualmente'),

    async execute(interaction) {
        const { guild, client } = interaction;
        const queue = client.queues.get(guild.id);
        
        if (!queue || queue.songs.length < 3) {
            return interaction.reply({ 
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription('❌ Servono almeno 2 canzoni nella coda (oltre quella in riproduzione)!')
                ],
                ephemeral: true 
            });
        }

        const currentSong = queue.songs.shift();
        
        // Fisher-Yates shuffle algorithm
        for (let i = queue.songs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [queue.songs[i], queue.songs[j]] = [queue.songs[j], queue.songs[i]];
        }
        
        queue.songs.unshift(currentSong);

        interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setDescription('🔀 Coda mescolata con successo!')
            ]
        });
    }
};
