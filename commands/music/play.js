const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getSongInfo, createMusicEmbed, createControlButtons, searchYouTube } = require('../../utils/musicUtils');
const MusicQueue = require('../../utils/MusicQueue');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('🎵 Riproduci una canzone o playlist')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Nome canzone, URL YouTube/Spotify')
                .setRequired(true)
                .setAutocomplete(true)),

    cooldown: 3,

    async autocomplete(interaction) {
        try {
            const focusedValue = interaction.options.getFocused();
            
            if (focusedValue.length < 2) {
                return await interaction.respond([
                    { name: '🔍 Scrivi almeno 2 caratteri per cercare...', value: 'placeholder' }
                ]);
            }

            const results = await searchYouTube(focusedValue, 10);
            
            if (!results || !results.length) {
                return await interaction.respond([
                    { name: '❌ Nessun risultato trovato', value: 'no_results' }
                ]);
            }

            const choices = results.map(video => {
                // Validazione sicura
                const title = video?.title || 'Sconosciuto';
                const duration = video?.duration || '?:??';
                const url = video?.url || '';
                
                const truncatedTitle = title.length > 75 ? title.substring(0, 72) + '...' : title;
                return {
                    name: `${truncatedTitle} [${duration}]`,
                    value: url
                };
            }).filter(choice => choice.value); // Rimuovi risultati senza URL

            await interaction.respond(choices);
        } catch (error) {
            console.error('❌ Errore autocompletamento:', error);
            try {
                await interaction.respond([
                    { name: '❌ Errore durante la ricerca', value: 'error' }
                ]);
            } catch (e) {}
        }
    },

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const { member, guild, channel, client } = interaction;

            // Verifica canale vocale
            if (!member.voice.channel) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setDescription('❌ Devi essere in un canale vocale per riprodurre musica!')
                    ]
                });
            }

            // Verifica permessi bot
            const permissions = member.voice.channel.permissionsFor(client.user);
            if (!permissions || !permissions.has(['Connect', 'Speak'])) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setDescription('❌ Non ho i permessi per entrare/parlare in questo canale vocale!')
                    ]
                });
            }

            const query = interaction.options.getString('query');
            
            // Valida query
            if (['placeholder', 'no_results', 'error'].includes(query)) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setDescription('❌ Query non valida! Riprova con una ricerca diversa.')
                    ]
                });
            }

            let queue = client.queues.get(guild.id);
            let isNewQueue = false;

            // Crea nuova coda se necessario
            if (!queue) {
                isNewQueue = true;
                queue = new MusicQueue(guild.id, member.voice.channel, channel, client.config);
                
                try {
                    const connected = await queue.connect(guild);
                    
                    if (!connected) {
                        return await interaction.editReply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0xFF0000)
                                    .setDescription('❌ Impossibile connettersi al canale vocale!')
                            ]
                        });
                    }

                    client.queues.set(guild.id, queue);
                } catch (error) {
                    console.error('❌ Errore connessione:', error);
                    return await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xFF0000)
                                .setDescription('❌ Errore durante la connessione al canale vocale!')
                        ]
                    });
                }
            } else {
                // Verifica stesso canale
                if (queue.voiceChannel && queue.voiceChannel.id !== member.voice.channel.id) {
                    return await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xFF0000)
                                .setDescription(`❌ Sono già in uso in <#${queue.voiceChannel.id}>!`)
                        ]
                    });
                }
            }

            // Verifica limite coda
            const maxQueueSize = client.config?.maxQueueSize || 100;
            if (queue.songs.length >= maxQueueSize) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setDescription(`❌ Coda piena! Limite massimo: ${maxQueueSize} canzoni.`)
                    ]
                });
            }

            // Ottieni info canzone
            let songInfo;
            try {
                songInfo = await getSongInfo(query, member.user);
            } catch (error) {
                console.error('❌ Errore getSongInfo:', error);
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setDescription('❌ Errore durante il recupero delle informazioni della canzone!')
                    ]
                });
            }
            
            if (!songInfo) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setDescription('❌ Impossibile trovare la canzone richiesta!')
                    ]
                });
            }

            // Aggiungi alla coda
            queue.songs.push(songInfo);

            // Determina se avviare la riproduzione
            const shouldStartPlaying = queue.songs.length === 1 && !queue.playing;
            
            if (shouldStartPlaying) {
                // Avvia riproduzione
                queue.playSong().catch(error => {
                    console.error('❌ Errore playSong:', error);
                    
                    channel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xFF0000)
                                .setDescription('❌ Errore durante la riproduzione!')
                        ]
                    }).catch(() => {});
                });
                
                // Rispondi con embed
                const embed = createMusicEmbed(songInfo, 'playing');
                const buttons = createControlButtons(queue);
                
                return await interaction.editReply({ 
                    embeds: [embed], 
                    components: [buttons] 
                });
            } else {
                // Aggiungi alla coda
                const embed = createMusicEmbed(songInfo, 'added');
                embed.addFields({ 
                    name: '📍 Posizione in Coda', 
                    value: `#${queue.songs.length}`, 
                    inline: true 
                });
                
                return await interaction.editReply({ 
                    embeds: [embed] 
                });
            }

        } catch (error) {
            console.error('❌ Errore generale comando play:', error);
            
            try {
                if (interaction.deferred || interaction.replied) {
                    return await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xFF0000)
                                .setDescription(`❌ Errore inaspettato!\n\`\`\`${error.message}\`\`\``)
                        ]
                    });
                } else {
                    return await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xFF0000)
                                .setDescription(`❌ Errore inaspettato!\n\`\`\`${error.message}\`\`\``)
                        ],
                        ephemeral: true
                    });
                }
            } catch (replyError) {
                console.error('❌ Impossibile rispondere:', replyError);
            }
        }
    }
};