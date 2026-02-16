const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Warning = require('../../models/Warning');
const Utils = require('../../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Visualizza gli avvertimenti')
        .addSubcommand(subcommand =>
            subcommand
                .setName('utente')
                .setDescription('Mostra tutti i warn di un utente specifico')
                .addUserOption(option =>
                    option.setName('utente')
                        .setDescription('L\'utente da controllare')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('server')
                .setDescription('Mostra tutti i warn del server')
                .addIntegerOption(option =>
                    option.setName('limite')
                        .setDescription('Numero di warn da mostrare (default: 10)')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(25)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('top')
                .setDescription('Mostra gli utenti con più warn')
                .addIntegerOption(option =>
                    option.setName('limite')
                        .setDescription('Numero di utenti da mostrare (default: 10)')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(25)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    permissions: PermissionFlagsBits.ModerateMembers,
    cooldown: 5,

    async execute(interaction) {
        await interaction.deferReply();

        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'utente':
                    await this.showUserWarnings(interaction);
                    break;
                case 'server':
                    await this.showServerWarnings(interaction);
                    break;
                case 'top':
                    await this.showTopWarnings(interaction);
                    break;
            }
        } catch (error) {
            console.error('Errore comando warnings:', error);
            await interaction.editReply('❌ Si è verificato un errore!');
        }
    },

    /**
     * Mostra i warning di un utente specifico
     */
    async showUserWarnings(interaction) {
        const targetUser = interaction.options.getUser('utente');

        // Recupera tutti i warning dell'utente
        const warnings = await Warning.find({
            guildId: interaction.guild.id,
            userId: targetUser.id
        }).sort({ createdAt: -1 }).lean();

        if (warnings.length === 0) {
            return interaction.editReply(`✅ **${targetUser.tag}** non ha avvertimenti!`);
        }

        const embed = new EmbedBuilder()
            .setColor('#FFFF00')
            .setTitle(`⚠️ Avvertimenti di ${targetUser.tag}`)
            .setDescription(`**Totale avvertimenti:** ${warnings.length}`)
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp();

        // Aggiungi i warning all'embed (max 10)
        const warningsToShow = warnings.slice(0, 10);
        
        for (const warn of warningsToShow) {
            const moderator = await interaction.guild.members.fetch(warn.moderatorId).catch(() => null);
            const moderatorName = moderator ? moderator.user.tag : 'Moderatore Sconosciuto';
            const warnDate = new Date(warn.createdAt);

            embed.addFields({
                name: `⚠️ Warning #${warn._id.toString().slice(-6)}`,
                value: `**Motivo:** ${warn.reason}\n**Moderatore:** ${moderatorName}\n**Data:** <t:${Math.floor(warnDate.getTime() / 1000)}:R>`,
                inline: false
            });
        }

        if (warnings.length > 10) {
            embed.setFooter({ text: `Mostrati 10 di ${warnings.length} avvertimenti` });
        }

        await interaction.editReply({ embeds: [embed] });
    },

    /**
     * Mostra tutti i warning recenti del server
     */
    async showServerWarnings(interaction) {
        const limit = interaction.options.getInteger('limite') || 10;

        // Recupera i warning recenti
        const warnings = await Warning.find({
            guildId: interaction.guild.id
        }).sort({ createdAt: -1 }).limit(limit).lean();

        if (warnings.length === 0) {
            return interaction.editReply('✅ Non ci sono avvertimenti in questo server!');
        }

        // Conta warning totali
        const totalWarnings = await Warning.countDocuments({
            guildId: interaction.guild.id
        });

        const embed = new EmbedBuilder()
            .setColor('#FFFF00')
            .setTitle(`⚠️ Avvertimenti del Server`)
            .setDescription(`**Totale avvertimenti:** ${totalWarnings}\n**Mostrati:** ${warnings.length}`)
            .setTimestamp();

        for (const warn of warnings) {
            const user = await interaction.guild.members.fetch(warn.userId).catch(() => null);
            const moderator = await interaction.guild.members.fetch(warn.moderatorId).catch(() => null);
            
            const userName = user ? user.user.tag : `Utente Sconosciuto (${warn.userId})`;
            const moderatorName = moderator ? moderator.user.tag : 'Moderatore Sconosciuto';
            const warnDate = new Date(warn.createdAt);

            embed.addFields({
                name: `⚠️ Warning #${warn._id.toString().slice(-6)}`,
                value: `**Utente:** ${userName}\n**Motivo:** ${warn.reason}\n**Moderatore:** ${moderatorName}\n**Data:** <t:${Math.floor(warnDate.getTime() / 1000)}:R>`,
                inline: false
            });
        }

        if (totalWarnings > limit) {
            embed.setFooter({ text: `Usa /warnings server limite:${limit + 10} per vedere più avvertimenti` });
        }

        await interaction.editReply({ embeds: [embed] });
    },

    /**
     * Mostra gli utenti con più warning
     */
    async showTopWarnings(interaction) {
        const limit = interaction.options.getInteger('limite') || 10;

        // Aggrega i warning per utente
        const topWarnings = await Warning.aggregate([
            { $match: { guildId: interaction.guild.id } },
            {
                $group: {
                    _id: '$userId',
                    count: { $sum: 1 },
                    lastWarning: { $max: '$createdAt' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: limit }
        ]);

        if (topWarnings.length === 0) {
            return interaction.editReply('✅ Non ci sono avvertimenti in questo server!');
        }

        const embed = new EmbedBuilder()
            .setColor('#FFFF00')
            .setTitle('📊 Top Utenti con più Avvertimenti')
            .setDescription('Classifica degli utenti con più avvertimenti')
            .setTimestamp();

        let position = 1;
        for (const data of topWarnings) {
            const user = await interaction.guild.members.fetch(data._id).catch(() => null);
            const userName = user ? user.user.tag : `Utente Sconosciuto (${data._id})`;
            
            const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `**#${position}**`;
            const lastWarnDate = new Date(data.lastWarning);

            embed.addFields({
                name: `${medal} ${userName}`,
                value: `**Avvertimenti:** ${data.count}\n**Ultimo warn:** <t:${Math.floor(lastWarnDate.getTime() / 1000)}:R>`,
                inline: true
            });

            position++;
        }

        await interaction.editReply({ embeds: [embed] });
    }
};
