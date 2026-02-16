const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Ottieni il link per invitare il bot nel tuo server'),
    
    cooldown: 10,

    async execute(interaction) {
        const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=1099511627830&scope=bot%20applications.commands`;
        const supportServer = 'https://discord.gg/tuosupportserver'; // Sostituisci con il tuo link

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🤖 Invita il Bot!')
            .setDescription('Grazie per il tuo interesse! Clicca sui pulsanti qui sotto per invitare il bot o unirti al server di supporto.')
            .addFields(
                {
                    name: '✨ Funzionalità',
                    value: '• Sistema di moderazione completo\n' +
                           '• Comandi slash moderni\n' +
                           '• Statistiche e leaderboard\n' +
                           '• Sistema di avvertimenti e ban\n' +
                           '• Multilingua (30+ lingue)\n' +
                           '• Database MongoDB integrato',
                    inline: false
                },
                {
                    name: '🔒 Permessi Richiesti',
                    value: '• Gestire Messaggi\n' +
                           '• Bannare Membri\n' +
                           '• Espellere Membri\n' +
                           '• Moderare Membri\n' +
                           '• Gestire Canali\n' +
                           '• Gestire Ruoli',
                    inline: true
                },
                {
                    name: '📊 Statistiche',
                    value: `• Server: **${interaction.client.guilds.cache.size}**\n` +
                           `• Utenti: **${interaction.client.guilds.cache.reduce((a, g) => a + g.memberCount, 0).toLocaleString()}**\n` +
                           `• Uptime: **${Math.floor(interaction.client.uptime / 3600000)}h**`,
                    inline: true
                }
            )
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ 
                text: `Richiesto da ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL() 
            })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Invita il Bot')
                    .setStyle(ButtonStyle.Link)
                    .setURL(inviteLink)
                    .setEmoji('🤖'),
                new ButtonBuilder()
                    .setLabel('Server di Supporto')
                    .setStyle(ButtonStyle.Link)
                    .setURL(supportServer)
                    .setEmoji('💬'),
                new ButtonBuilder()
                    .setLabel('Documentazione')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://github.com/tuousername/bot-docs')
                    .setEmoji('📚')
            );

        await interaction.reply({ 
            embeds: [embed], 
            components: [row] 
        });
    },
};
