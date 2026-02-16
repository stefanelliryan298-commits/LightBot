const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('🔊 Imposta il volume di riproduzione')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Livello volume (0-100)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(100)),

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

        const level = interaction.options.getInteger('level');
        queue.volume = level;

        if (queue.currentResource?.volume) {
            queue.currentResource.volume.setVolume(level / 100);
        }

        const volumeBar = '█'.repeat(Math.floor(level / 10)) + '░'.repeat(10 - Math.floor(level / 10));
        
        interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('🔊 Volume Modificato')
                    .setDescription(`\`${volumeBar}\` ${level}%`)
            ]
        });
    }
};
