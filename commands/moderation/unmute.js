const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Mute = require('../../models/Mute');
const Utils = require('../../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Rimuove il timeout da un utente')
        .addUserOption(option =>
            option.setName('utente')
                .setDescription('L\'utente da riabilitare')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Il motivo dell\'unmute')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    permissions: PermissionFlagsBits.ModerateMembers,
    cooldown: 3,

    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('utente');
        const reason = interaction.options.getString('motivo') || 'Nessun motivo specificato';

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!targetMember) {
            return interaction.editReply('❌ Utente non trovato nel server!');
        }

        // Controlla se l'utente è in timeout
        if (!targetMember.communicationDisabledUntil || targetMember.communicationDisabledUntil < Date.now()) {
            return interaction.editReply('❌ Questo utente non è in timeout!');
        }

        try {
            // Rimuovi il timeout
            await targetMember.timeout(null, `${reason} - Unmute da ${interaction.user.tag}`);

            // Aggiorna il database
            await Mute.updateMany(
                { 
                    guildId: interaction.guild.id,
                    userId: targetUser.id,
                    active: true 
                },
                { active: false }
            );

            // Embed di conferma
            const embed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('🔊 Timeout Rimosso')
                .setDescription(`**${targetUser.tag}** è stato riabilitato!`)
                .addFields(
                    { name: '👤 Utente', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '👮 Moderatore', value: `${interaction.user.tag}`, inline: true },
                    { name: '📝 Motivo', value: reason }
                )
                .setFooter({ text: `ID: ${targetUser.id}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            await Utils.sendLog(interaction.guild, embed);

            // Invia DM all'utente
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#57F287')
                    .setTitle(`🔊 Timeout Rimosso in ${interaction.guild.name}`)
                    .setDescription('Il tuo timeout è stato rimosso!')
                    .addFields(
                        { name: '📝 Motivo', value: reason }
                    )
                    .setFooter({ text: 'Ora puoi tornare a scrivere e parlare normalmente.' })
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                // L'utente ha i DM disabilitati
            }

        } catch (error) {
            console.error('Errore comando unmute:', error);
            
            if (error.code === 50013) {
                return interaction.editReply('❌ Non ho i permessi per rimuovere il timeout da questo utente!');
            }
            
            await interaction.editReply('❌ Si è verificato un errore durante l\'unmute!');
        }
    },
};