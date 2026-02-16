const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('forceplay')
        .setDescription('🔧 [ADMIN] Forza la riproduzione di una canzone bypassando la coda')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Nome canzone o URL')
                .setRequired(true)),

    // Permessi richiesti (solo admin può usare questo comando)
    permissions: [PermissionFlagsBits.Administrator],

    // Cooldown in secondi (5 secondi per questo comando)
    cooldown: 5,

    async execute(interaction, client) {
        const { member, guild, channel } = interaction;
        
        await interaction.deferReply();

        // Verifica canale vocale
        if (!member.voice.channel) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription('❌ Devi essere in un canale vocale!')
                ]
            });
        }

        const query = interaction.options.getString('query');
        const queue = client.queues.get(guild.id);

        // Logica del comando qui...
        // Esempio: aggiungi la canzone all'inizio della coda invece che alla fine

        interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('⚡ Force Play')
                    .setDescription(`La canzone sarà riprodotta immediatamente!`)
                    .addFields({
                        name: '🎵 Canzone',
                        value: query
                    })
            ]
        });
    }
};
