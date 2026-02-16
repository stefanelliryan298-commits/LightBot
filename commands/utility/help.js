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
                    { name: '/ban', description: 'Banna un utente dal server' },
                    { name: '/kick', description: 'Espelli un utente dal server' },
                    { name: '/warn', description: 'Avverti un utente' },
                    { name: '/timeout', description: 'Metti un utente in timeout' },
                    { name: '/mute', description: 'Silenzia un utente (text/voice/both)' },
                    { name: '/unmute', description: 'Riattiva un utente silenziato' },
                    { name: '/lock', description: 'Blocca un canale' },
                    { name: '/unlock', description: 'Sblocca un canale' }
                ]
            },
            utility: {
                name: '🔧 Utilità',
                commands: [
                    { name: '/help', description: 'Mostra questo messaggio di aiuto' },
                    { name: '/invite', description: 'Ottieni il link per invitare il bot' },
                    { name: '/stats', description: 'Visualizza le statistiche del server' },
                    { name: '/profile', description: 'Visualizza il profilo di un utente' },
                    { name: '/leaderboard', description: 'Visualizza la classifica del server' },
                    { name: '/setlang', description: 'Imposta la lingua del server' }
                ]
            },
            admin: {
                name: '⚙️ Amministrazione',
                commands: [
                    { name: '/warnlist', description: 'Visualizza la lista degli avvertimenti di un utente' },
                    { name: '/banlist', description: 'Visualizza la lista dei ban attivi' },
                    { name: '/mutelist', description: 'Visualizza la lista dei mute attivi' },
                    { name: '/clearwarns', description: 'Cancella gli avvertimenti di un utente' }
                ]
            }
        };

        const mainEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🤖 Centro Aiuto Bot Moderazione')
            .setDescription('Benvenuto nel centro aiuto! Ecco una panoramica di tutti i comandi disponibili.\n\n' +
                'Usa il menu sottostante per esplorare le diverse categorie di comandi.')
            .addFields(
                { 
                    name: '🛡️ Moderazione', 
                    value: 'Comandi per gestire utenti e canali', 
                    inline: true 
                },
                { 
                    name: '🔧 Utilità', 
                    value: 'Comandi informativi e di supporto', 
                    inline: true 
                },
                { 
                    name: '⚙️ Amministrazione', 
                    value: 'Comandi avanzati di gestione', 
                    inline: true 
                }
            )
            .addFields({
                name: '📚 Informazioni',
                value: '• Usa `/comando` per eseguire un comando\n' +
                       '• Alcuni comandi richiedono permessi specifici\n' +
                       '• Per supporto, usa `/invite` per entrare nel server di supporto'
            })
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ 
                text: `Richiesto da ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL() 
            })
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_category')
            .setPlaceholder('Seleziona una categoria')
            .addOptions([
                {
                    label: 'Panoramica',
                    description: 'Torna alla panoramica principale',
                    value: 'main',
                    emoji: '🏠'
                },
                {
                    label: 'Moderazione',
                    description: 'Comandi di moderazione',
                    value: 'moderation',
                    emoji: '🛡️'
                },
                {
                    label: 'Utilità',
                    description: 'Comandi di utilità',
                    value: 'utility',
                    emoji: '🔧'
                },
                {
                    label: 'Amministrazione',
                    description: 'Comandi amministrativi',
                    value: 'admin',
                    emoji: '⚙️'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const response = await interaction.reply({ 
            embeds: [mainEmbed], 
            components: [row],
            fetchReply: true
        });

        // Collector per il menu
        const collector = response.createMessageComponentCollector({ 
            time: 300000 // 5 minuti
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ 
                    content: '❌ Questo menu non è per te!', 
                    ephemeral: true 
                });
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
                categoryEmbed.addFields({
                    name: cmd.name,
                    value: cmd.description,
                    inline: false
                });
            });

            await i.update({ embeds: [categoryEmbed], components: [row] });
        });

        collector.on('end', async () => {
            try {
                const disabledRow = new ActionRowBuilder().addComponents(
                    selectMenu.setDisabled(true)
                );
                await response.edit({ components: [disabledRow] });
            } catch (error) {
                // Il messaggio potrebbe essere stato cancellato
            }
        });
    },
};
