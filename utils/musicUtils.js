const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const play = require('play-dl');

/**
 * Cerca video su YouTube con play-dl
 */
async function searchYouTube(query, limit = 10) {
    try {
        const results = await play.search(query, { 
            limit: limit, 
            source: { youtube: "video" } 
        });

        if (!results || results.length === 0) {
            return [];
        }

        return results.map(video => ({
            title: video.title || 'Sconosciuto',
            url: video.url,
            duration: formatDuration(video.durationInSec),
            thumbnail: video.thumbnails?.[0]?.url || '',
            artist: video.channel?.name || 'Sconosciuto'
        }));
    } catch (error) {
        console.error('❌ Errore ricerca YouTube:', error);
        return [];
    }
}

/**
 * Ottieni info canzone da URL o query
 */
async function getSongInfo(query, requestedBy) {
    try {
        let songData;

        // Se è un URL YouTube
        if (query.includes('youtube.com') || query.includes('youtu.be')) {
            console.log('🔍 URL rilevato:', query);
            
            const info = await play.video_info(query);
            
            if (!info || !info.video_details) {
                console.error('❌ Nessuna info per URL:', query);
                return null;
            }

            songData = {
                title: info.video_details.title,
                url: info.video_details.url,
                duration: formatDuration(info.video_details.durationInSec),
                thumbnail: info.video_details.thumbnails?.[0]?.url || '',
                artist: info.video_details.channel?.name || 'Sconosciuto',
                requestedBy: requestedBy
            };
        } else {
            // Ricerca per query
            console.log('🔍 Ricerca:', query);
            
            const results = await searchYouTube(query, 1);
            
            if (!results || results.length === 0) {
                console.error('❌ Nessun risultato per:', query);
                return null;
            }

            songData = {
                ...results[0],
                requestedBy: requestedBy
            };
        }

        // Validazione finale URL
        if (!songData.url || songData.url === 'undefined') {
            console.error('❌ URL non valido:', songData);
            return null;
        }

        console.log(`✅ Song ottenuta: ${songData.title}`);
        console.log(`   URL: ${songData.url}`);
        
        return songData;

    } catch (error) {
        console.error('❌ Errore getSongInfo:', error);
        return null;
    }
}

/**
 * Crea embed musicale
 */
function createMusicEmbed(song, type = 'playing') {
    const colors = {
        playing: 0x00FF00,
        added: 0x0099FF,
        error: 0xFF0000,
        info: 0xFFFF00
    };

    const embed = new EmbedBuilder()
        .setColor(colors[type] || colors.info)
        .setThumbnail(song.thumbnail || 'https://i.imgur.com/AfFp7pu.png')
        .setTimestamp();

    if (type === 'playing') {
        embed
            .setTitle('🎵 Ora in Riproduzione')
            .setDescription(`**[${song.title}](${song.url})**`)
            .addFields(
                { name: '⏱️ Durata', value: song.duration, inline: true },
                { name: '👤 Artista', value: song.artist || 'Sconosciuto', inline: true },
                { name: '🎧 Richiesto da', value: song.requestedBy.toString(), inline: true }
            )
            .setFooter({ text: '🎶 Usa i pulsanti per controllare' });
    } else if (type === 'added') {
        embed
            .setTitle('➕ Aggiunto alla Coda')
            .setDescription(`**[${song.title}](${song.url})**`)
            .addFields(
                { name: '⏱️ Durata', value: song.duration, inline: true },
                { name: '🎧 Richiesto da', value: song.requestedBy.toString(), inline: true }
            );
    }

    return embed;
}

/**
 * Crea pulsanti di controllo
 */
function createControlButtons(queue) {
    const pauseButton = new ButtonBuilder()
        .setCustomId('pause')
        .setLabel(queue.playing ? 'Pausa' : 'Riprendi')
        .setStyle(ButtonStyle.Primary);

    const skipButton = new ButtonBuilder()
        .setCustomId('skip')
        .setLabel('Skip')
        .setStyle(ButtonStyle.Primary);

    const loopButton = new ButtonBuilder()
        .setCustomId('loop')
        .setLabel(queue.loop ? 'Loop: ON' : 'Loop: OFF')
        .setStyle(queue.loop ? ButtonStyle.Success : ButtonStyle.Secondary);

    const shuffleButton = new ButtonBuilder()
        .setCustomId('shuffle')
        .setLabel('Shuffle')
        .setStyle(ButtonStyle.Secondary);

    const stopButton = new ButtonBuilder()
        .setCustomId('stop')
        .setLabel('Stop')
        .setStyle(ButtonStyle.Danger);

    return new ActionRowBuilder().addComponents(
        pauseButton,
        skipButton,
        loopButton,
        shuffleButton,
        stopButton
    );
}

/**
 * Formatta durata in secondi
 */
function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

module.exports = {
    searchYouTube,
    getSongInfo,
    createMusicEmbed,
    createControlButtons,
    formatDuration
};