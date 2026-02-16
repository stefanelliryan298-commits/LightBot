const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('🗑️ Rimuovi una canzone dalla coda')
        .addIntegerOption(option =>
            option.setName('position')
                .setDescription('Posizione nella coda (1 = prossima canzone)')
                .setRequired(true)
                .setMinValue(1)),

    async execute(interaction) {
        const { guild, client } = interaction;
        const queue = client.queues.get(guild.id);
        
        if (!queue || queue.songs.length < 2) {
            return interaction.reply({ 
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription('❌ La coda è vuota!')
                ],
                ephemeral: true 
            });
        }

        const position = interaction.options.getInteger('position');
        
        if (position < 1 || position > queue.songs.length) {
            return interaction.reply({ 
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription(`❌ Posizione non valida! Range: 1-${queue.songs.length}`)
                ],
                ephemeral: true 
            });
        }

        if (position === 1) {
            return interaction.reply({ 
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription('❌ Non puoi rimuovere la canzone in riproduzione! Usa `/skip`')
                ],
                ephemeral: true 
            });
        }

        const removed = queue.songs.splice(position - 1, 1)[0];
        
        interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setDescription(`✅ Rimossa dalla posizione #${position}:\n**${removed.title}**`)
            ]
        });
    }
};
