// commands/partner/listpartner.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ServerConfig = require('../../models/ServerConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listpartner')
        .setDescription('Mostra la lista dei partner registrati in questo server'),

    async execute(interaction) {
        const config = await ServerConfig.findOne({ guildId: interaction.guild.id });

        if (!config?.partners?.length) {
            const emptyEmbed = new EmbedBuilder()
                .setTitle('🤝 Lista Partner')
                .setDescription('> Questo server non ha ancora nessun partner registrato.\n> Usa `/partnership` per aggiungerne uno!')
                .setColor(0xFF4444)
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setTimestamp();
            return interaction.reply({ embeds: [emptyEmbed], ephemeral: true });
        }

        const partners = config.partners;
        const ITEMS_PER_PAGE = 5;
        const page = 0;
        const start = page * ITEMS_PER_PAGE;
        const slice = partners.slice(start, start + ITEMS_PER_PAGE);
        const totalPages = Math.ceil(partners.length / ITEMS_PER_PAGE);

        let description = '';
        slice.forEach((partner, i) => {
            const num     = start + i + 1;
            const link    = partner.link ? `[Unisciti](${partner.link})` : '`Nessun link`';
            const manager = partner.manager ? `\`${partner.manager}\`` : '`—`';
            const author  = partner.author  ? `\`${partner.author}\``  : '`—`';
            description +=
                `**${num}. ${partner.title || 'Senza titolo'}**\n` +
                `> 📄 ${partner.description || 'Nessuna descrizione'}\n` +
                `> 🔗 ${link}  •  👤 ${author}  •  📋 ${manager}\n\n`;
        });

        const embed = new EmbedBuilder()
            .setTitle(`🤝 Partner di ${interaction.guild.name}`)
            .setDescription(description)
            .setColor(0x00FFAA)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setFooter({
                text: `${partners.length} partner totali • Pagina ${page + 1}/${totalPages}`,
                iconURL: interaction.guild.iconURL({ dynamic: true })
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};