const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Mostra tutti i comandi disponibili del bot'),

    cooldown: 5,

    async execute(interaction) {
        const categories = {
            moderation: {
                name: '🛡️ Moderazione',
                commands: [
                    { name: '/ban',      description: 'Banna un utente dal server' },
                    { name: '/kick',     description: 'Espelli un utente dal server' },
                    { name: '/warn',     description: 'Avverti un utente' },
                    { name: '/timeout',  description: 'Metti un utente in timeout' },
                    { name: '/mute',     description: 'Silenzia un utente (text/voice/both)' },
                    { name: '/unmute',   description: 'Riattiva un utente silenziato' },
                    { name: '/lock',     description: 'Blocca un canale' },
                    { name: '/unlock',   description: 'Sblocca un canale' },
                ]
            },
            utility: {
                name: '🔧 Utilità',
                commands: [
                    { name: '/help',        description: 'Mostra questo messaggio di aiuto' },
                    { name: '/invite',      description: 'Ottieni il link per invitare il bot' },
                    { name: '/stats',       description: 'Visualizza le statistiche del server' },
                    { name: '/profile',     description: 'Visualizza il profilo di un utente' },
                    { name: '/leaderboard', description: 'Visualizza la classifica del server' },
                    { name: '/setlang',     description: 'Imposta la lingua del server' },
                ]
            },
            admin: {
                name: '⚙️ Amministrazione',
                commands: [
                    { name: '/warnlist',   description: 'Visualizza la lista degli avvertimenti di un utente' },
                    { name: '/banlist',    description: 'Visualizza la lista dei ban attivi' },
                    { name: '/mutelist',   description: 'Visualizza la lista dei mute attivi' },
                    { name: '/clearwarns', description: 'Cancella gli avvertimenti di un utente' },
                ]
            },
            antispam: {
                name: '🚫 Anti-Spam',
                commands: [
                    { name: '/antispam toggle',   description: 'Abilita o disabilita la protezione anti-spam' },
                    { name: '/antispam settings', description: 'Configura il limite di messaggi (30, 50, 80 msg/min)' },
                    { name: '/antispam status',   description: 'Visualizza lo stato del sistema anti-spam' },
                ]
            },
            antinuke: {
                name: '☢️ Anti-Nuke',
                commands: [
                    { name: '/antinuke toggle',    description: 'Abilita o disabilita la protezione anti-nuke' },
                    { name: '/antinuke status',    description: 'Visualizza lo stato anti-nuke' },
                    { name: '/antinuke config',    description: 'Configura impostazioni avanzate (ban/kick/canali/ruoli)' },
                    { name: '/antinuke limits',    description: 'Visualizza i limiti di protezione configurati' },
                    { name: '/antinuke whitelist', description: 'Aggiungi, rimuovi o visualizza la whitelist utenti' },
                ]
            },
            antiraid: {
                name: '🚨 Anti-Raid',
                commands: [
                    { name: '/antiraid toggle', description: 'Abilita o disabilita la protezione anti-raid' },
                    { name: '/antiraid status', description: 'Visualizza lo stato del sistema anti-raid' },
                    { name: '/antiraid config', description: 'Configura soglia join e azione (kick/ban/timeout)' },
                    { name: '/antiraid reset',  description: 'Resetta i contatori del sistema anti-raid' },
                ]
            },
            antilink: {
                name: '🔗 Anti-Link',
                commands: [
                    { name: '/antilink toggle',       description: 'Abilita o disabilita il blocco link Discord' },
                    { name: '/antilink status',       description: 'Visualizza lo stato del sistema anti-link' },
                    { name: '/linkwhitelist add',     description: 'Aggiungi un canale esente dal blocco link' },
                    { name: '/linkwhitelist remove',  description: 'Rimuovi un canale dalla whitelist' },
                    { name: '/linkwhitelist list',    description: 'Mostra i canali esenti dal blocco link' },
                ]
            },
            partnership: {
                name: '🤝 Partnership',
                commands: [
                    { name: '/partnership',   description: 'Invia una richiesta di partnership (modal)' },
                    { name: '/listpartner',   description: 'Mostra le statistiche partnership per ogni membro staff' },
                ]
            },
            suggestion: {
                name: '💡 Suggerimenti',
                commands: [
                    { name: '/suggestion setup', description: 'Configura il canale suggerimenti (solo Admin)' },
                    { name: '/suggestion send',  description: 'Invia un suggerimento al canale configurato' },
                ]
            },
        };

        // ── Embed principale ──────────────────────────────────────────────────
        const mainEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🤖 Centro Aiuto — LightBot')
            .setDescription(
                'Benvenuto nel centro aiuto! Ecco una panoramica di tutti i comandi disponibili.\n\n' +
                'Usa il menu sottostante per esplorare le diverse categorie.'
            )
            .addFields(
                { name: '🛡️ Moderazione',   value: 'Gestisci utenti e canali',          inline: true },
                { name: '🔧 Utilità',        value: 'Comandi informativi e di supporto', inline: true },
                { name: '⚙️ Amministrazione', value: 'Comandi avanzati di gestione',      inline: true },
                { name: '🚫 Anti-Spam',      value: 'Protezione da messaggi massivi',    inline: true },
                { name: '☢️ Anti-Nuke',      value: 'Protezione da attacchi al server',  inline: true },
                { name: '🚨 Anti-Raid',      value: 'Protezione da join massivi',        inline: true },
                { name: '🔗 Anti-Link',      value: 'Blocco link Discord non autorizzati', inline: true },
                { name: '🤝 Partnership',    value: 'Gestione partnership e staff',      inline: true },
                { name: '💡 Suggerimenti',   value: 'Sistema suggerimenti per il server', inline: true },
            )
            .addFields({
                name: '📚 Informazioni',
                value:
                    '• Usa `/comando` per eseguire un comando\n' +
                    '• I comandi di protezione richiedono il permesso **Amministratore**\n' +
                    '• `/suggestion send` è accessibile a tutti gli utenti\n' +
                    '• Per supporto, usa `/invite` per entrare nel server di supporto',
            })
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({
                text: `Richiesto da ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        // ── Select menu ───────────────────────────────────────────────────────
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_category')
            .setPlaceholder('Seleziona una categoria')
            .addOptions([
                { label: 'Panoramica',      description: 'Torna alla panoramica principale',        value: 'main',        emoji: '🏠' },
                { label: 'Moderazione',     description: 'Comandi di moderazione',                  value: 'moderation',  emoji: '🛡️' },
                { label: 'Utilità',         description: 'Comandi di utilità',                      value: 'utility',     emoji: '🔧' },
                { label: 'Amministrazione', description: 'Comandi amministrativi',                  value: 'admin',       emoji: '⚙️' },
                { label: 'Anti-Spam',       description: 'Protezione messaggi massivi',             value: 'antispam',    emoji: '🚫' },
                { label: 'Anti-Nuke',       description: 'Protezione attacchi al server',           value: 'antinuke',    emoji: '☢️' },
                { label: 'Anti-Raid',       description: 'Protezione join massivi',                 value: 'antiraid',    emoji: '🚨' },
                { label: 'Anti-Link',       description: 'Blocco link Discord non autorizzati',     value: 'antilink',    emoji: '🔗' },
                { label: 'Partnership',     description: 'Gestione partnership e statistiche',      value: 'partnership', emoji: '🤝' },
                { label: 'Suggerimenti',    description: 'Sistema suggerimenti',                    value: 'suggestion',  emoji: '💡' },
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const response = await interaction.reply({
            embeds: [mainEmbed],
            components: [row],
            fetchReply: true
        });

        // ── Collector ─────────────────────────────────────────────────────────
        const collector = response.createMessageComponentCollector({
            time: 300000 // 5 minuti
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: '❌ Questo menu non è per te!', ephemeral: true });
            }

            const selectedCategory = i.values[0];

            if (selectedCategory === 'main') {
                await i.update({ embeds: [mainEmbed], components: [row] });
                return;
            }

            const category = categories[selectedCategory];
            const categoryEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(category.name)
                .setDescription('Ecco tutti i comandi disponibili in questa categoria:')
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .setFooter({
                    text: `Richiesto da ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            category.commands.forEach(cmd => {
                categoryEmbed.addFields({ name: cmd.name, value: cmd.description, inline: false });
            });

            await i.update({ embeds: [categoryEmbed], components: [row] });
        });

        collector.on('end', async () => {
            try {
                const disabledRow = new ActionRowBuilder().addComponents(
                    selectMenu.setDisabled(true)
                );
                await response.edit({ components: [disabledRow] });
            } catch (_) {}
        });
    },
};