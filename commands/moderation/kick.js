const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Utils = require('../../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Espelli un utente dal server')
        .addUserOption(option =>
            option.setName('utente')
                .setDescription('L\'utente da espellere')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Il motivo dell\'espulsione')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    
    permissions: PermissionFlagsBits.KickMembers,
    cooldown: 3,

    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('utente');
        const reason = interaction.options.getString('motivo');

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!targetMember) {
            return interaction.editReply('❌ Utente non trovato nel server!');
        }

        // Controlla la gerarchia dei ruoli
        if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.editReply('❌ Non puoi espellere questo utente perché ha un ruolo superiore o uguale al tuo!');
        }

        if (!targetMember.kickable) {
            return interaction.editReply('❌ Non posso espellere questo utente! Potrebbe avere permessi superiori.');
        }

        try {
            // Espelli l'utente
            await targetMember.kick(`${reason} - Espulso da ${interaction.user.tag}`);

            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('👢 Utente Espulso')
                .setDescription(`**${targetUser.tag}** è stato espulso dal server!`)
                .addFields(
                    { name: '👤 Utente', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '👮 Moderatore', value: `${interaction.user.tag}`, inline: true },
                    { name: '📝 Motivo', value: reason }
                )
                .setTimestamp()
                .setFooter({ text: `ID: ${targetUser.id}` });

            await interaction.editReply({ embeds: [embed] });
            await Utils.sendLog(interaction.guild, embed);

        } catch (error) {
            console.error('Errore comando kick:', error);
            await interaction.editReply('❌ Si è verificato un errore durante l\'espulsione dell\'utente!');
        }
    },
};
