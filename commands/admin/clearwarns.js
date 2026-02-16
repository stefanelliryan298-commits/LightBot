const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Warning = require('../../models/Warning');
const UserStats = require('../../models/UserStats');
const Utils = require('../../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearwarns')
        .setDescription('Cancella tutti gli avvertimenti di un utente')
        .addUserOption(option =>
            option.setName('utente')
                .setDescription('L\'utente a cui cancellare i warning')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Il motivo della cancellazione')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    permissions: PermissionFlagsBits.Administrator,
    cooldown: 5,

    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('utente');
        const reason = interaction.options.getString('motivo') || 'Nessun motivo specificato';

        try {
            // Conta i warning dell'utente
            const warningCount = await Warning.countDocuments({
                guildId: interaction.guild.id,
                userId: targetUser.id
            });

            if (warningCount === 0) {
                return interaction.editReply(`✅ **${targetUser.tag}** non ha avvertimenti da cancellare!`);
            }

            // Conferma prima di cancellare
            const confirmEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('⚠️ Conferma Cancellazione')
                .setDescription(`Sei sicuro di voler cancellare **${warningCount}** avvertimenti di **${targetUser.tag}**?`)
                .addFields(
                    { name: '👤 Utente', value: `${targetUser.tag} (${targetUser.id})` },
                    { name: '📊 Warning da Cancellare', value: `${warningCount}` },
                    { name: '📋 Motivo', value: reason }
                )
                .setFooter({ text: 'Questa azione è irreversibile!' })
                .setTimestamp();

            const confirmMessage = await interaction.editReply({
                embeds: [confirmEmbed],
                components: [{
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 4, // DANGER
                            label: 'Conferma',
                            custom_id: 'confirm_clear',
                            emoji: '✅'
                        },
                        {
                            type: 2,
                            style: 2, // SECONDARY
                            label: 'Annulla',
                            custom_id: 'cancel_clear',
                            emoji: '❌'
                        }
                    ]
                }]
            });

            // Aspetta la risposta (30 secondi)
            const filter = i => i.user.id === interaction.user.id;
            const collector = confirmMessage.createMessageComponentCollector({ filter, time: 30000, max: 1 });

            collector.on('collect', async i => {
                if (i.customId === 'confirm_clear') {
                    // Cancella tutti i warning
                    const result = await Warning.deleteMany({
                        guildId: interaction.guild.id,
                        userId: targetUser.id
                    });

                    // Resetta il contatore nelle statistiche
                    await UserStats.updateOne(
                        { guildId: interaction.guild.id, userId: targetUser.id },
                        { $set: { warnings: 0 } }
                    );

                    const successEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('✅ Avvertimenti Cancellati')
                        .setDescription(`Sono stati cancellati **${result.deletedCount}** avvertimenti di **${targetUser.tag}**!`)
                        .addFields(
                            { name: '👤 Utente', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                            { name: '🗑️ Cancellati da', value: interaction.user.tag, inline: true },
                            { name: '📋 Motivo', value: reason }
                        )
                        .setTimestamp()
                        .setFooter({ text: `Warning cancellati: ${result.deletedCount}` });

                    await i.update({ embeds: [successEmbed], components: [] });
                    await Utils.sendLog(interaction.guild, successEmbed);

                    // Invia DM all'utente
                    try {
                        const dmEmbed = new EmbedBuilder()
                            .setColor('#00FF00')
                            .setTitle(`✅ Avvertimenti Cancellati in ${interaction.guild.name}`)
                            .setDescription(`Tutti i tuoi avvertimenti sono stati cancellati!`)
                            .addFields(
                                { name: '📊 Warning Cancellati', value: `${result.deletedCount}` },
                                { name: '📋 Motivo', value: reason }
                            )
                            .setTimestamp();

                        await targetUser.send({ embeds: [dmEmbed] });
                    } catch (error) {
                        // L'utente ha i DM disabilitati
                    }

                } else {
                    const cancelEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('❌ Cancellazione Annullata')
                        .setDescription('La cancellazione dei warning è stata annullata.')
                        .setTimestamp();

                    await i.update({ embeds: [cancelEmbed], components: [] });
                }
            });

            collector.on('end', async collected => {
                if (collected.size === 0) {
                    const timeoutEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('⏱️ Tempo Scaduto')
                        .setDescription('Tempo scaduto! La cancellazione dei warning è stata annullata.')
                        .setTimestamp();

                    await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
                }
            });

        } catch (error) {
            console.error('Errore comando clearwarns:', error);
            await interaction.editReply('❌ Si è verificato un errore durante la cancellazione dei warning!');
        }
    },
};
