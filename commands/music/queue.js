const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { formatDuration } = require('../../utils/musicUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('📋 Mostra la coda delle canzoni')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Numero pagina (default: 1)')
                .setRequired(false)
                .setMinValue(1)),

    async execute(interaction) {
        const { guild, client } = interaction;
        const queue = client.queues.get(guild.id);
        
        if (!queue || !queue.songs.length) {
            return interaction.reply({ 
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription('❌ La coda è vuota!')
                ],
                ephemeral: true 
            });
        }

        const page = interaction.options.getInteger('page') || 1;
        const songsPerPage = 10;
        const start = (page - 1) * songsPerPage;
        const end = start + songsPerPage;
        const totalPages = Math.ceil(queue.songs.length / songsPerPage);

        if (page > totalPages) {
            return interaction.reply({ 
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setDescription(`❌ Pagina non valida! Massimo: ${totalPages}`)
                ],
                ephemeral: true 
            });
        }

        const queueList = queue.songs.slice(start, end).map((song, i) => {
            const index = start + i;
            const prefix = index === 0 ? '🎵' : `\`${index}.\``;
            return `${prefix} **[${song.title.substring(0, 50)}${song.title.length > 50 ? '...' : ''}](${song.url})** \`${song.duration}\``;
        }).join('\n');

        // Calcola durata totale
        const totalDuration = queue.songs.reduce((acc, song) => {
            const parts = song.duration.split(':').map(Number);
            let seconds = 0;
            if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
            else if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
            return acc + seconds;
        }, 0);

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('📋 Coda Musicale')
            .setDescription(queueList || 'Nessuna canzone')
            .addFields(
                { 
                    name: '🔁 Loop', 
                    value: queue.loop === 'off' ? 'Off' : queue.loop === 'song' ? '🔂 Canzone' : '🔁 Coda', 
                    inline: true 
                },
                { 
                    name: '🔊 Volume', 
                    value: `${queue.volume}%`, 
                    inline: true 
                },
                { 
                    name: '📊 Totale', 
                    value: `${queue.songs.length} canzoni`, 
                    inline: true 
                },
                {
                    name: '⏱️ Durata Totale',
                    value: formatDuration(totalDuration),
                    inline: true
                }
            )
            .setFooter({ text: `Pagina ${page}/${totalPages} • Usa /queue page:<numero>` })
            .setTimestamp();

        interaction.reply({ embeds: [embed] });
    }
};
