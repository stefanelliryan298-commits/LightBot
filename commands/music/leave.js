const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('👋 Disconnetti il bot dal vocale'),

    cooldown: 3,

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const { guild, client } = interaction;

            // Verifica se il bot è in vocale
            const connection = client.voiceConnections?.get(guild.id);

            if (!connection) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xFFFF00)
                            .setDescription('⚠️ Non sono connesso a nessun canale vocale!')
                    ]
                });
            }

            // Disconnetti
            const channelName = `#${guild.channels.cache.get(connection.joinConfig.channelId)?.name || 'sconosciuto'}`;
            connection.destroy();
            client.voiceConnections.delete(guild.id);

            console.log(`✅ Disconnesso da ${channelName} in ${guild.name}`);

            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setDescription(`👋 Disconnesso da ${channelName}!`)
                ]
            });

        } catch (error) {
            console.error('❌ Errore comando /leave:', error);
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