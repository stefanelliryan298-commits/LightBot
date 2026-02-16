const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Warning = require('../../models/Warning');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnlist')
        .setDescription('Visualizza la lista degli avvertimenti di un utente')
        .addUserOption(option =>
            option.setName('utente')
                .setDescription('L\'utente di cui visualizzare gli avvertimenti')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    permissions: PermissionFlagsBits.ModerateMembers,
    cooldown: 5,

    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('utente');

        try {
            const warnings = await Warning.find({
                guildId: interaction.guild.id,
                userId: targetUser.id
            }).sort({ createdAt: -1 }).limit(25);

            if (warnings.length === 0) {
                return interaction.editReply(`✅ **${targetUser.tag}** non ha avvertimenti!`);
            }

            const embed = new EmbedBuilder()
                .setColor('#FFFF00')
                .setTitle(`⚠️ Avvertimenti di ${targetUser.tag}`)
                .setDescription(`Totale avvertimenti: **${warnings.length}**`)
                .setThumbnail(targetUser.displayAvatarURL());

            warnings.slice(0, 10).forEach((warn, index) => {
                embed.addFields({
                    name: `${index + 1}. Warning ID: ${warn._id.toString().slice(-6)}`,
                    value: `**Motivo:** ${warn.reason}\n` +
                           `**Moderatore:** <@${warn.moderatorId}>\n` +
                           `**Data:** <t:${Math.floor(warn.createdAt.getTime() / 1000)}:R>`,
                    inline: false
                });
            });

            if (warnings.length > 10) {
                embed.setFooter({ text: `Mostrati 10 di ${warnings.length} avvertimenti totali` });
            }

            embed.setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Errore comando warnlist:', error);
            await interaction.editReply('❌ Si è verificato un errore nel recupero degli avvertimenti!');
        }
    },
};
