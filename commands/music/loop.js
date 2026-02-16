const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('🔁 Imposta modalità loop')
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Modalità loop')
                .setRequired(true)
                .addChoices(
                    { name: '❌ Off - Nessun loop', value: 'off' },
                    { name: '🔂 Song - Ripeti canzone corrente', value: 'song' },
                    { name: '🔁 Queue - Ripeti intera coda', value: 'queue' }
                )),

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

        const mode = interaction.options.getString('mode');
        queue.loop = mode;

        const modeEmojis = { off: '❌', song: '🔂', queue: '🔁' };
        const modeText = mode === 'off' ? 'Disattivato' : mode === 'song' ? 'Canzone Corrente' : 'Intera Coda';
        
        interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(mode === 'off' ? 0xFF0000 : 0x00FF00)
                    .setDescription(`${modeEmojis[mode]} Loop impostato su: **${modeText}**`)
            ]
        });
    }
};
