const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Warning = require('../../models/Warning');
const UserStats = require('../../models/UserStats');
const Utils = require('../../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unwarn')
        .setDescription('Rimuove un avvertimento specifico')
        .addStringOption(option =>
            option.setName('id')
                .setDescription('L\'ID del warning da rimuovere (ultime 6 cifre)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Il motivo della rimozione')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    permissions: PermissionFlagsBits.ModerateMembers,
    cooldown: 3,

    async execute(interaction) {
        await interaction.deferReply();

        const warningId = interaction.options.getString('id');
        const reason = interaction.options.getString('motivo') || 'Nessun motivo specificato';

        try {
            // Cerca il warning con ID che termina con le cifre fornite
            const warnings = await Warning.find({
                guildId: interaction.guild.id
            }).lean();

            const warning = warnings.find(w => w._id.toString().endsWith(warningId));

            if (!warning) {
                return interaction.editReply(`❌ Nessun warning trovato con ID che termina con \`${warningId}\`!\n\n💡 **Suggerimento:** Usa \`/warnings utente\` per vedere gli ID dei warning.`);
            }

            // Recupera info sull'utente
            const targetUser = await interaction.client.users.fetch(warning.userId).catch(() => null);
            const moderator = await interaction.client.users.fetch(warning.moderatorId).catch(() => null);

            const userName = targetUser ? targetUser.tag : `Utente Sconosciuto (${warning.userId})`;
            const moderatorName = moderator ? moderator.tag : 'Moderatore Sconosciuto';

            // Elimina il warning
            await Warning.deleteOne({ _id: warning._id });

            // Aggiorna il contatore warnings nelle statistiche (decrementa)
            await UserStats.updateOne(
                { guildId: interaction.guild.id, userId: warning.userId },
                { $inc: { warnings: -1 } }
            );

            // Conta i warning rimanenti
            const remainingWarnings = await Warning.countDocuments({
                guildId: interaction.guild.id,
                userId: warning.userId
            });

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Avvertimento Rimosso')
                .setDescription(`Il warning **#${warning._id.toString().slice(-6)}** è stato rimosso!`)
                .addFields(
                    { name: '👤 Utente', value: userName, inline: true },
                    { name: '👮 Warning dato da', value: moderatorName, inline: true },
                    { name: '📊 Warning Rimanenti', value: `${remainingWarnings}`, inline: true },
                    { name: '📝 Motivo Originale', value: warning.reason, inline: false },
                    { name: '🗑️ Rimosso da', value: interaction.user.tag, inline: true },
                    { name: '📋 Motivo Rimozione', value: reason, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `ID Warning: ${warning._id}` });

            await interaction.editReply({ embeds: [embed] });
            await Utils.sendLog(interaction.guild, embed);

            // Invia DM all'utente (se possibile)
            if (targetUser) {
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle(`✅ Avvertimento Rimosso in ${interaction.guild.name}`)
                        .setDescription(`Uno dei tuoi avvertimenti è stato rimosso!`)
                        .addFields(
                            { name: '📝 Motivo Warning', value: warning.reason },
                            { name: '📋 Motivo Rimozione', value: reason },
                            { name: '📊 Warning Rimanenti', value: `${remainingWarnings}` }
                        )
                        .setTimestamp();

                    await targetUser.send({ embeds: [dmEmbed] });
                } catch (error) {
                    // L'utente ha i DM disabilitati
                }
            }

        } catch (error) {
            console.error('Errore comando unwarn:', error);
            await interaction.editReply('❌ Si è verificato un errore durante la rimozione del warning!');
        }
    },
};
