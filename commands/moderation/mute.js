const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Mute = require('../../models/Mute');
const Utils = require('../../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Silenzia un utente (timeout)')
        .addUserOption(option =>
            option.setName('utente')
                .setDescription('L\'utente da silenziare')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('durata')
                .setDescription('Durata del mute (es: 5m, 1h, 1d, 7d) - Max 28 giorni')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Il motivo del mute')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    permissions: PermissionFlagsBits.ModerateMembers,
    cooldown: 3,

    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('utente');
        const duration = interaction.options.getString('durata');
        const reason = interaction.options.getString('motivo');

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!targetMember) {
            return interaction.editReply('❌ Utente non trovato nel server!');
        }

        // Controlla la gerarchia dei ruoli
        if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.editReply('❌ Non puoi silenziare questo utente perché ha un ruolo superiore o uguale al tuo!');
        }

        // Non puoi mutare il proprietario del server
        if (targetMember.id === interaction.guild.ownerId) {
            return interaction.editReply('❌ Non puoi silenziare il proprietario del server!');
        }

        try {
            // Calcola la durata in millisecondi
            const durationMs = Utils.parseDuration(duration);
            
            if (!durationMs) {
                return interaction.editReply('❌ Formato durata non valido! Usa: 5m, 1h, 1d, 7d');
            }

            // Discord permette timeout massimo di 28 giorni (2419200000 ms)
            const maxTimeout = 28 * 24 * 60 * 60 * 1000; // 28 giorni
            
            if (durationMs > maxTimeout) {
                return interaction.editReply('❌ La durata massima del timeout è 28 giorni!');
            }

            // Minimo 5 secondi
            if (durationMs < 5000) {
                return interaction.editReply('❌ La durata minima del timeout è 5 secondi!');
            }

            // Calcola quando scade
            const expiresAt = new Date(Date.now() + durationMs);

            // Applica il timeout
            await targetMember.timeout(durationMs, `${reason} - Mute da ${interaction.user.tag}`);

            // Salva nel database
            const mute = new Mute({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                moderatorId: interaction.user.id,
                reason: reason,
                type: 'both', // Timeout blocca sia text che voice
                duration: duration,
                expiresAt: expiresAt,
                active: true
            });

            await mute.save();

            // Embed di conferma
            const embed = new EmbedBuilder()
                .setColor('#8B0000')
                .setTitle('🔇 Utente Silenziato')
                .setDescription(`**${targetUser.tag}** è stato messo in timeout!`)
                .addFields(
                    { name: '👤 Utente', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '👮 Moderatore', value: `${interaction.user.tag}`, inline: true },
                    { name: '⏰ Durata', value: Utils.formatDuration(durationMs), inline: true },
                    { name: '⏳ Scade', value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>`, inline: true },
                    { name: '📝 Motivo', value: reason, inline: false }
                )
                .setFooter({ text: `ID: ${targetUser.id}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            await Utils.sendLog(interaction.guild, embed);

            // Invia DM all'utente
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#8B0000')
                    .setTitle(`🔇 Silenziato in ${interaction.guild.name}`)
                    .setDescription('Sei stato messo in timeout!')
                    .addFields(
                        { name: '⏰ Durata', value: Utils.formatDuration(durationMs) },
                        { name: '⏳ Scade', value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:R>` },
                        { name: '📝 Motivo', value: reason }
                    )
                    .setFooter({ text: 'Non potrai scrivere, parlare o reagire fino alla scadenza del timeout.' })
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                // L'utente ha i DM disabilitati
            }

        } catch (error) {
            console.error('Errore comando mute:', error);
            
            if (error.code === 50013) {
                return interaction.editReply('❌ Non ho i permessi per silenziare questo utente!');
            }
            
            await interaction.editReply('❌ Si è verificato un errore durante il mute!');
        }
    },
};