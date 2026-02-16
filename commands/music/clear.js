const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('🗑️ Svuota completamente la coda'),

    async execute(interaction) {
        const { guild, client } = interaction;
        const queue = client.queues.get(guild.id);
        
        if (!queue || queue.songs.length < 2) {
            return interaction.reply({ 
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription('❌ La coda è già vuota!')
                ],
                ephemeral: true 
            });
        }

        const removedCount = queue.songs.length - 1;
        const currentSong = queue.songs[0];
        queue.songs = [currentSong];
        
        interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setDescription(`🗑️ Coda svuotata! Rimosse **${removedCount}** canzoni.\n(Canzone corrente mantenuta)`)
            ]
        });
    }
};
