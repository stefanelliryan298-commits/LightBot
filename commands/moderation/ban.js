const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Ban = require('../../models/Ban');
const Utils = require('../../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Banna un utente dal server')
        .addUserOption(option =>
            option.setName('utente')
                .setDescription('L\'utente da bannare')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Il motivo del ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('durata')
                .setDescription('Durata del ban (es: 1h, 1d, 7d, permanent)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    
    permissions: PermissionFlagsBits.BanMembers,
    cooldown: 5,

    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('utente');
        const reason = interaction.options.getString('motivo');
        const duration = interaction.options.getString('durata') || 'permanent';

        // Controlla se l'utente esiste nel server
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (targetMember) {
            // Controlla la gerarchia dei ruoli
            if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                return interaction.editReply('❌ Non puoi bannare questo utente perché ha un ruolo superiore o uguale al tuo!');
            }

            if (!targetMember.bannable) {
                return interaction.editReply('❌ Non posso bannare questo utente! Potrebbe avere permessi superiori.');
            }
        }

        try {
            // Calcola la data di scadenza se non è permanente
            let expiresAt = null;
            if (duration !== 'permanent') {
                const durationMs = Utils.parseDuration(duration);
                if (!durationMs) {
                    return interaction.editReply('❌ Formato durata non valido! Usa: 1h, 1d, 7d, etc.');
                }
                expiresAt = new Date(Date.now() + durationMs);
            }

            // Salva il ban nel database
            const banRecord = new Ban({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                username: targetUser.tag,
                moderatorId: interaction.user.id,
                reason: reason,
                duration: duration,
                expiresAt: expiresAt
            });

            await banRecord.save();

            // Banna l'utente
            await interaction.guild.members.ban(targetUser.id, {
                reason: `${reason} - Bannato da ${interaction.user.tag}`,
                deleteMessageSeconds: 604800 // Elimina messaggi ultimi 7 giorni
            });

            // Crea embed di conferma
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔨 Utente Bannato')
                .setDescription(`**${targetUser.tag}** è stato bannato dal server!`)
                .addFields(
                    { name: '👤 Utente', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '👮 Moderatore', value: `${interaction.user.tag}`, inline: true },
                    { name: '⏰ Durata', value: duration === 'permanent' ? 'Permanente' : Utils.formatDuration(Utils.parseDuration(duration)), inline: true },
                    { name: '📝 Motivo', value: reason }
                )
                .setTimestamp()
                .setFooter({ text: `ID: ${targetUser.id}` });

            await interaction.editReply({ embeds: [embed] });

            // Invia log se configurato
            await Utils.sendLog(interaction.guild, embed);

            // Se il ban è temporaneo, programma lo unban
            if (expiresAt) {
                setTimeout(async () => {
                    try {
                        await interaction.guild.members.unban(targetUser.id, 'Ban temporaneo scaduto');
                        await Ban.updateOne(
                            { guildId: interaction.guild.id, userId: targetUser.id },
                            { active: false }
                        );
                    } catch (error) {
                        console.error('Errore unban automatico:', error);
                    }
                }, expiresAt - Date.now());
            }

        } catch (error) {
            console.error('Errore comando ban:', error);
            await interaction.editReply('❌ Si è verificato un errore durante il ban dell\'utente!');
        }
    },
};
