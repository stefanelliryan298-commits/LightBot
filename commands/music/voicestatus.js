const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('voicestatus')
        .setDescription('📊 Mostra lo status del bot in vocale'),

    cooldown: 3,

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const { guild, client } = interaction;

            // Verifica connessione
            const connection = client.voiceConnections?.get(guild.id);

            if (!connection) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setTitle('📊 Status Vocale')
                            .setDescription('❌ Non sono connesso a nessun canale vocale')
                    ]
                });
            }

            const channelId = connection.joinConfig.channelId;
            const channel = guild.channels.cache.get(channelId);
            const members = channel?.members?.size || 0;
            const state = connection.state.status;

            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('📊 Status Vocale')
                        .addFields(
                            { name: '📍 Canale', value: `<#${channelId}>` || 'Sconosciuto', inline: true },
                            { name: '👥 Utenti', value: `${members}`, inline: true },
                            { name: '🟢 Status', value: '✅ Connesso', inline: true },
                            { name: '⏱️ Stato Connessione', value: state || 'Ready', inline: true }
                        )
                        .setTimestamp()
                ]
            });

        } catch (error) {
            console.error('❌ Errore comando /voicestatus:', error);
            try {
                if (interaction.deferred || interaction.replied) {
                    return await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xFF0000)
                                .setDescription(`❌ Errore: ${error.message}`)
                        ]
                    });
                }
            } catch (replyError) {
                console.error('❌ Impossibile rispondere:', replyError);
            }
        }
    }
};