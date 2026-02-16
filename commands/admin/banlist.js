const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const Ban = require('../../models/Ban');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banlist')
        .setDescription('Visualizza la lista di tutti i ban attivi nel server')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addStringOption(option =>
            option.setName('tipo')
                .setDescription('Tipo di ban da visualizzare')
                .addChoices(
                    { name: 'Tutti i ban', value: 'all' },
                    { name: 'Solo ban del server', value: 'server' },
                    { name: 'Solo ban del database', value: 'database' }
                )
                .setRequired(false)
        ),
    
    permissions: PermissionFlagsBits.BanMembers,
    cooldown: 10,

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const tipo = interaction.options.getString('tipo') || 'all';
            const BANS_PER_PAGE = 10;

            // Ottieni i ban dal server Discord
            let serverBans = [];
            if (tipo === 'all' || tipo === 'server') {
                const fetchedBans = await interaction.guild.bans.fetch();
                serverBans = Array.from(fetchedBans.values());
            }

            // Ottieni i ban dal database
            let dbBans = [];
            if (tipo === 'all' || tipo === 'database') {
                dbBans = await Ban.find({
                    guildId: interaction.guild.id,
                    active: true
                }).sort({ createdAt: -1 });
            }

            // Crea un Map per unire i ban (usa userId come chiave)
            const allBansMap = new Map();

            // Aggiungi i ban del database
            dbBans.forEach(ban => {
                allBansMap.set(ban.userId, {
                    userId: ban.userId,
                    username: ban.username || 'Unknown User',
                    reason: ban.reason,
                    moderatorId: ban.moderatorId,
                    duration: ban.duration,
                    expiresAt: ban.expiresAt,
                    createdAt: ban.createdAt,
                    source: 'database'
                });
            });

            // Aggiungi i ban del server (sovrascrivi se già esistono)
            serverBans.forEach(ban => {
                const existingBan = allBansMap.get(ban.user.id);
                
                if (existingBan) {
                    // Il ban esiste in entrambi, aggiungi info del server
                    existingBan.source = 'both';
                    existingBan.serverReason = ban.reason || 'Nessun motivo specificato';
                } else {
                    // Ban solo dal server
                    allBansMap.set(ban.user.id, {
                        userId: ban.user.id,
                        username: ban.user.tag,
                        reason: ban.reason || 'Nessun motivo specificato',
                        moderatorId: null,
                        duration: 'permanent',
                        expiresAt: null,
                        createdAt: null,
                        source: 'server'
                    });
                }
            });

            const allBans = Array.from(allBansMap.values());

            if (allBans.length === 0) {
                return interaction.editReply('✅ Non ci sono ban attivi in questo server!');
            }

            // Calcola il numero totale di pagine
            const totalPages = Math.ceil(allBans.length / BANS_PER_PAGE);
            let currentPage = 0;

            // Funzione per creare l'embed di una pagina specifica
            const createEmbed = (page) => {
                const start = page * BANS_PER_PAGE;
                const end = start + BANS_PER_PAGE;
                const pageBans = allBans.slice(start, end);

                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('🔨 Lista Ban Attivi')
                    .setDescription(
                        `**Totale ban:** ${allBans.length}\n` +
                        `📊 Ban del server: ${serverBans.length}\n` +
                        `💾 Ban nel database: ${dbBans.length}\n\n` +
                        `Pagina ${page + 1} di ${totalPages}`
                    )
                    .setThumbnail(interaction.guild.iconURL());

                pageBans.forEach((ban, index) => {
                    const globalIndex = start + index;
                    let sourceEmoji = '';
                    if (ban.source === 'both') sourceEmoji = '🔗';
                    else if (ban.source === 'server') sourceEmoji = '📊';
                    else if (ban.source === 'database') sourceEmoji = '💾';

                    const durationText = ban.duration === 'permanent' 
                        ? 'Permanente' 
                        : ban.expiresAt 
                            ? `Scade <t:${Math.floor(ban.expiresAt.getTime() / 1000)}:R>`
                            : 'Permanente';

                    let fieldValue = `**User ID:** ${ban.userId}\n`;
                    
                    if (ban.source === 'both' && ban.serverReason) {
                        fieldValue += `**Motivo (Server):** ${ban.serverReason}\n`;
                        fieldValue += `**Motivo (DB):** ${ban.reason}\n`;
                    } else {
                        fieldValue += `**Motivo:** ${ban.reason}\n`;
                    }

                    if (ban.moderatorId) {
                        fieldValue += `**Moderatore:** <@${ban.moderatorId}>\n`;
                    }
                    
                    fieldValue += `**Durata:** ${durationText}\n`;
                    
                    if (ban.createdAt) {
                        fieldValue += `**Data:** <t:${Math.floor(ban.createdAt.getTime() / 1000)}:R>\n`;
                    }
                    
                    fieldValue += `**Fonte:** ${sourceEmoji} ${ban.source === 'both' ? 'Server + Database' : ban.source === 'server' ? 'Solo Server' : 'Solo Database'}`;

                    embed.addFields({
                        name: `${globalIndex + 1}. ${ban.username}`,
                        value: fieldValue,
                        inline: false
                    });
                });

                embed.setTimestamp();
                embed.setFooter({ text: `📄 Pagina ${page + 1}/${totalPages} • ${allBans.length} ban totali` });

                return embed;
            };

            // Funzione per creare i bottoni di navigazione
            const createButtons = (page) => {
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('first')
                            .setLabel('⏮️ Prima')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId('prev')
                            .setLabel('◀️ Precedente')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId('page')
                            .setLabel(`${page + 1}/${totalPages}`)
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('Successiva ▶️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === totalPages - 1),
                        new ButtonBuilder()
                            .setCustomId('last')
                            .setLabel('Ultima ⏭️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === totalPages - 1)
                    );
                return row;
            };

            // Invia il messaggio iniziale
            const message = await interaction.editReply({
                embeds: [createEmbed(currentPage)],
                components: totalPages > 1 ? [createButtons(currentPage)] : []
            });

            // Se c'è solo una pagina, non creare il collector
            if (totalPages <= 1) return;

            // Crea il collector per i bottoni
            const collector = message.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 300000 // 5 minuti
            });

            collector.on('collect', async i => {
                // Verifica che sia l'utente che ha eseguito il comando
                if (i.user.id !== interaction.user.id) {
                    return i.reply({
                        content: '❌ Non puoi usare questi bottoni!',
                        ephemeral: true
                    });
                }

                // Aggiorna la pagina corrente
                if (i.customId === 'first') {
                    currentPage = 0;
                } else if (i.customId === 'prev') {
                    currentPage = Math.max(0, currentPage - 1);
                } else if (i.customId === 'next') {
                    currentPage = Math.min(totalPages - 1, currentPage + 1);
                } else if (i.customId === 'last') {
                    currentPage = totalPages - 1;
                }

                // Aggiorna il messaggio
                await i.update({
                    embeds: [createEmbed(currentPage)],
                    components: [createButtons(currentPage)]
                });
            });

            collector.on('end', async () => {
                // Disabilita tutti i bottoni quando il collector scade
                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('first')
                            .setLabel('⏮️ Prima')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('prev')
                            .setLabel('◀️ Precedente')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('page')
                            .setLabel(`${currentPage + 1}/${totalPages}`)
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('Successiva ▶️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('last')
                            .setLabel('Ultima ⏭️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true)
                    );

                await interaction.editReply({
                    components: [disabledRow]
                }).catch(() => {});
            });

        } catch (error) {
            console.error('Errore comando banlist:', error);
            await interaction.editReply('❌ Si è verificato un errore nel recupero della lista ban!');
        }
    },
};