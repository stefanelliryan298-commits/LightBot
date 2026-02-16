const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Warning = require('../../models/Warning');
const UserStats = require('../../models/UserStats');
const Utils = require('../../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Avverti un utente')
        .addUserOption(option =>
            option.setName('utente')
                .setDescription('L\'utente da avvertire')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Il motivo dell\'avvertimento')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    permissions: PermissionFlagsBits.ModerateMembers,
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
            return interaction.editReply('❌ Non puoi avvertire questo utente perché ha un ruolo superiore o uguale al tuo!');
        }

        try {
            // Salva il warning nel database
            const warning = new Warning({
                guildId: interaction.guild.id,
                userId: targetUser.id,
                moderatorId: interaction.user.id,
                reason: reason
            });

            await warning.save();

            // Aggiorna il contatore warnings nelle statistiche
            await UserStats.updateOne(
                { guildId: interaction.guild.id, userId: targetUser.id },
                { $inc: { warnings: 1 } },
                { upsert: true }
            );

            // Conta i warning totali dell'utente
            const warningCount = await Warning.countDocuments({
                guildId: interaction.guild.id,
                userId: targetUser.id
            });

            const embed = new EmbedBuilder()
                .setColor('#FFFF00')
                .setTitle('⚠️ Utente Avvertito')
                .setDescription(`**${targetUser.tag}** ha ricevuto un avvertimento!`)
                .addFields(
                    { name: '👤 Utente', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: '👮 Moderatore', value: `${interaction.user.tag}`, inline: true },
                    { name: '📊 Avvertimenti Totali', value: `${warningCount}`, inline: true },
                    { name: '📝 Motivo', value: reason }
                )
                .setTimestamp()
                .setFooter({ text: `ID Warning: ${warning._id}` });

            // Avviso automatico se supera 3 warning
            if (warningCount >= 3) {
                embed.addFields({
                    name: '🚨 Attenzione',
                    value: `Questo utente ha raggiunto **${warningCount} avvertimenti**. Considera azioni disciplinari!`
                });
            }

            await interaction.editReply({ embeds: [embed] });
            await Utils.sendLog(interaction.guild, embed);

            // Invia DM all'utente avvertito
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#FFFF00')
                    .setTitle(`⚠️ Avvertimento in ${interaction.guild.name}`)
                    .setDescription(`Hai ricevuto un avvertimento!`)
                    .addFields(
                        { name: '📝 Motivo', value: reason },
                        { name: '📊 Avvertimenti Totali', value: `${warningCount}` }
                    )
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                // L'utente ha i DM disabilitati
            }

        } catch (error) {
            console.error('Errore comando warn:', error);
            await interaction.editReply('❌ Si è verificato un errore durante l\'avvertimento!');
        }
    },
};
