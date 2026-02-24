// commands/partner/listpartner.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ServerConfig = require('../../models/ServerConfig');

const STAFF_PER_EMBED = 6; // quanti membri staff per embed prima di splittare

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listpartner')
        .setDescription('Mostra le statistiche partnership per ogni membro dello staff'),

    async execute(interaction) {
        await interaction.deferReply();

        const config = await ServerConfig.findOne({ guildId: interaction.guild.id });

        if (!config?.partners?.length) {
            const emptyEmbed = new EmbedBuilder()
                .setTitle('🤝 Statistiche Partnership')
                .setDescription(
                    '> Nessuna partnership registrata in questo server.\n' +
                    '> Usa `/partnership` per aggiungerne una!'
                )
                .setColor(0xFF4444)
                .setFooter({
                    text: interaction.guild.name,
                    iconURL: interaction.guild.iconURL({ dynamic: true }) ?? undefined
                })
                .setTimestamp();

            return interaction.editReply({ embeds: [emptyEmbed] });
        }

        const partners = config.partners;

        // ── Conteggio per autore ──────────────────────────────────────────────
        const countMap = {};
        for (const p of partners) {
            const key = p.author || 'Sconosciuto';
            countMap[key] = (countMap[key] || 0) + 1;
        }

        // Ordina per conteggio decrescente
        const sorted = Object.entries(countMap).sort((a, b) => b[1] - a[1]);

        const totalPartners = partners.length;
        const totalStaff    = sorted.length;
        const guildIcon     = interaction.guild.iconURL({ dynamic: true }) ?? undefined;

        // ── Suddividi in chunk da STAFF_PER_EMBED ────────────────────────────
        const chunks = [];
        for (let i = 0; i < sorted.length; i += STAFF_PER_EMBED) {
            chunks.push(sorted.slice(i, i + STAFF_PER_EMBED));
        }

        const totalEmbeds = chunks.length;
        const embeds      = [];

        // Medaglie per i primi 3 in classifica
        const medals = ['🥇', '🥈', '🥉'];

        chunks.forEach((chunk, chunkIndex) => {
            const isFirst = chunkIndex === 0;
            const isLast  = chunkIndex === totalEmbeds - 1;

            // Costruisci le righe del chunk
            let description = '';
            chunk.forEach(([author, count], localIdx) => {
                const globalRank = chunkIndex * STAFF_PER_EMBED + localIdx;
                const medal      = medals[globalRank] ?? `**#${globalRank + 1}**`;
                const bar        = buildBar(count, totalPartners);

                description +=
                    `${medal} \`${author}\`\n` +
                    `> ${bar}  **${count}** partner${count !== 1 ? 's' : ''}\n\n`;
            });

            // Header solo nel primo embed
            const title = isFirst
                ? `🤝 Partnership Staff — ${interaction.guild.name}`
                : `🤝 Partnership Staff — continua`;

            // Footer con totali solo nell'ultimo embed
            const footerText = isLast
                ? `📊 Totale: ${totalPartners} partner  •  👥 ${totalStaff} membri attivi  •  ${chunkIndex + 1}/${totalEmbeds}`
                : `Pagina ${chunkIndex + 1}/${totalEmbeds}`;

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description.trim())
                .setColor(0xFF66CC)
                .setFooter({ text: footerText, iconURL: guildIcon })
                .setTimestamp();

            if (isFirst) embed.setThumbnail(guildIcon ?? null);

            embeds.push(embed);
        });

        await interaction.editReply({ embeds });
    }
};

/**
 * Genera una barra di progresso proporzionale al totale
 * @param {number} count  - valore dello staff
 * @param {number} total  - totale partner del server
 * @param {number} length - lunghezza della barra (default 8)
 */
function buildBar(count, total, length = 8) {
    const filled = Math.round((count / total) * length);
    const empty  = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}