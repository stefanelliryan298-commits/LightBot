// commands/partner/listpartner.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../utils/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listpartner')
        .setDescription('Mostra la lista dei partner registrati in questo server'),

    async execute(interaction) {
        const serverId   = interaction.guild.id;
        const serverData = db.getServer(serverId);

        if (!serverData?.partners || serverData.partners.length === 0) {
            const emptyEmbed = new EmbedBuilder()
                .setTitle('🤝 Lista Partner')
                .setDescription('> Questo server non ha ancora nessun partner registrato.\n> Usa `/partnership` per aggiungerne uno!')
                .setColor(0xFF4444)
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setTimestamp();

            return interaction.reply({ embeds: [emptyEmbed], ephemeral: true });
        }

        const partners = serverData.partners;
        const ITEMS_PER_PAGE = 5;
        const totalPages = Math.ceil(partners.length / ITEMS_PER_PAGE);

        // Costruiamo la lista (prima pagina)
        const buildEmbed = (page = 0) => {
            const start = page * ITEMS_PER_PAGE;
            const slice = partners.slice(start, start + ITEMS_PER_PAGE);

            const embed = new EmbedBuilder()
                .setTitle(`🤝 Partner di ${interaction.guild.name}`)
                .setColor(0x00FFAA)
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setFooter({
                    text: `${partners.length} partner totali • Pagina ${page + 1}/${totalPages}`,
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

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

            embed.setDescription(description || 'Nessun dato.');
            return embed;
        };

        await interaction.reply({ embeds: [buildEmbed(0)], ephemeral: false });
    }
};
