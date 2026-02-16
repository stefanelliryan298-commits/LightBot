const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    
    async execute(interaction) {
        // Gestisci solo button interaction
        if (!interaction.isButton()) return;

        const { client, guild, member } = interaction;

        // Verifica che l'utente sia in un canale vocale
        if (!member.voice.channel) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription('❌ Devi essere in un canale vocale!')
                ],
                ephemeral: true
            });
        }

        // Ottieni la coda del server
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

        // Verifica che l'utente sia nello stesso canale del bot
        if (queue.voiceChannel && queue.voiceChannel.id !== member.voice.channel.id) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription(`❌ Devi essere in <#${queue.voiceChannel.id}> per usare i controlli!`)
                ],
                ephemeral: true
            });
        }

        try {
            // Gestisci i vari bottoni (supporta sia 'pause' che 'music_pause' per compatibilità)
            const buttonId = interaction.customId.replace('music_', '');
            
            switch (buttonId) {
                case 'pause':
                    if (queue.playing) {
                        queue.pause();
                        await interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0x0099FF)
                                    .setDescription('⏸️ Musica in pausa!')
                            ],
                            ephemeral: true
                        });
                    } else {
                        await interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0xFF0000)
                                    .setDescription('❌ La musica è già in pausa!')
                            ],
                            ephemeral: true
                        });
                    }
                    break;

                case 'resume':
                    if (!queue.playing) {
                        queue.resume();
                        await interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0x00FF00)
                                    .setDescription('▶️ Musica ripresa!')
                            ],
                            ephemeral: true
                        });
                    } else {
                        await interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0xFF0000)
                                    .setDescription('❌ La musica sta già riproducendo!')
                            ],
                            ephemeral: true
                        });
                    }
                    break;

                case 'skip':
                    if (queue.songs.length > 1) {
                        const skipped = queue.songs[0];
                        queue.skip();
                        await interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0x0099FF)
                                    .setDescription(`⏭️ Saltata: **${skipped.title}**`)
                            ]
                        });
                    } else {
                        await interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0xFF0000)
                                    .setDescription('❌ Non ci sono altre canzoni nella coda!')
                            ],
                            ephemeral: true
                        });
                    }
                    break;

                case 'stop':
                    queue.stop();
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xFF0000)
                                .setDescription('⏹️ Riproduzione fermata e coda svuotata!')
                        ]
                    });
                    break;

                case 'loop':
                    if (queue.loop) {
                        queue.loop = false;
                        await interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0x0099FF)
                                    .setDescription('🔁 Loop disattivato!')
                            ],
                            ephemeral: true
                        });
                    } else {
                        queue.loop = true;
                        await interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0x00FF00)
                                    .setDescription('🔁 Loop attivato!')
                            ],
                            ephemeral: true
                        });
                    }
                    break;

                case 'shuffle':
                    if (queue.songs.length > 2) {
                        // Salva la canzone corrente
                        const current = queue.songs.shift();
                        
                        // Mescola il resto
                        for (let i = queue.songs.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [queue.songs[i], queue.songs[j]] = [queue.songs[j], queue.songs[i]];
                        }
                        
                        // Rimetti la canzone corrente all'inizio
                        queue.songs.unshift(current);
                        
                        await interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0x0099FF)
                                    .setDescription('🔀 Coda mescolata!')
                            ],
                            ephemeral: true
                        });
                    } else {
                        await interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0xFF0000)
                                    .setDescription('❌ Servono almeno 3 canzoni per mescolare!')
                            ],
                            ephemeral: true
                        });
                    }
                    break;

                case 'queue':
                    if (queue.songs.length === 0) {
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0xFF0000)
                                    .setDescription('❌ La coda è vuota!')
                            ],
                            ephemeral: true
                        });
                    }

                    const queueList = queue.songs.slice(0, 10).map((song, index) => {
                        return `${index === 0 ? '🎵' : `${index}.`} **${song.title}** - \`${song.duration}\``;
                    }).join('\n');

                    const remaining = queue.songs.length > 10 ? `\n\n*...e altre ${queue.songs.length - 10} canzoni*` : '';

                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0x0099FF)
                                .setTitle('📋 Coda Musicale')
                                .setDescription(queueList + remaining)
                                .setFooter({ text: `Totale: ${queue.songs.length} canzoni` })
                        ],
                        ephemeral: true
                    });
                    break;

                default:
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xFF0000)
                                .setDescription('❌ Bottone non riconosciuto!')
                        ],
                        ephemeral: true
                    });
            }

        } catch (error) {
            console.error('❌ Errore button interaction:', error);
            
            // Gestisci errore di risposta
            try {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription('❌ Errore durante l\'esecuzione del comando!');

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            } catch (replyError) {
                console.error('❌ Impossibile rispondere:', replyError);
            }
        }
    }
};
