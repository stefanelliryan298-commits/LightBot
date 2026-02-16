const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const { joinVoiceChannel, entersState, VoiceConnectionStatus } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ventiquattroh')
        .setDescription('🎙️ Mantieni il bot in vocale 24/7')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Canale vocale dove restare')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildVoice)),

    cooldown: 5,

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const voiceChannel = interaction.options.getChannel('channel');
            const { guild, client } = interaction;

            // Verifica permessi
            const permissions = voiceChannel.permissionsFor(client.user);
            if (!permissions || !permissions.has(['Connect', 'Speak'])) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setDescription('❌ Non ho i permessi per entrare/parlare in questo canale!')
                    ]
                });
            }

            // Verifica se il bot è già in vocale in questo server
            let connection = client.voiceConnections?.get(guild.id);

            if (connection) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xFFFF00)
                            .setDescription(`⚠️ Sono già in vocale in <#${connection.joinConfig.channelId}>!`)
                    ]
                });
            }

            // Connetti al canale vocale
            try {
                connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: guild.id,
                    adapterCreator: guild.voiceAdapterCreator,
                    selfDeaf: true,
                    selfMute: false
                });

                // Salva la connessione
                if (!client.voiceConnections) {
                    client.voiceConnections = new Map();
                }
                client.voiceConnections.set(guild.id, connection);

                // Aspetta che la connessione sia pronta
                await entersState(connection, VoiceConnectionStatus.Ready, 30000);

                // Gestisci disconnessioni accidentali
                connection.on(VoiceConnectionStatus.Disconnected, async () => {
                    console.log(`⚠️ Disconnesso da ${voiceChannel.name} in ${guild.name}`);
                    try {
                        await Promise.race([
                            entersState(connection, VoiceConnectionStatus.Signalling, 5000),
                            entersState(connection, VoiceConnectionStatus.Connecting, 5000),
                        ]);
                        console.log(`✅ Riconnesso a ${voiceChannel.name}`);
                    } catch (error) {
                        console.error(`❌ Non riesco a riconnettermi: ${error.message}`);
                        connection.destroy();
                        client.voiceConnections.delete(guild.id);
                    }
                });

                console.log(`✅ Bot connesso a ${voiceChannel.name} in ${guild.name}`);

                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x00FF00)
                            .setTitle('🎙️ 24/7 Vocale Attivo')
                            .setDescription(`✅ Rimango in <#${voiceChannel.id}> indefinitamente!`)
                            .addFields(
                                { name: '📍 Canale', value: voiceChannel.name, inline: true },
                                { name: '🔧 Status', value: 'Sempre Connesso', inline: true },
                                { name: 'ℹ️ Info', value: 'Usa `/leave` per disconnettermi', inline: false }
                            )
                            .setTimestamp()
                    ]
                });

            } catch (error) {
                console.error('❌ Errore connessione vocale:', error);
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setDescription(`❌ Errore durante la connessione: ${error.message}`)
                    ]
                });
            }

        } catch (error) {
            console.error('❌ Errore comando /24h:', error);
            try {
                if (interaction.deferred || interaction.replied) {
                    return await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xFF0000)
                                .setDescription(`❌ Errore inaspettato!\n\`\`\`${error.message}\`\`\``)
                        ]
                    });
                }
            } catch (replyError) {
                console.error('❌ Impossibile rispondere:', replyError);
            }
        }
    }
};