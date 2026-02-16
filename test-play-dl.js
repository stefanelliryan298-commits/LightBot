// test-play-dl.js
// Script per testare play-dl e verificare che funzioni

const play = require('play-dl');

console.log('🧪 TEST PLAY-DL\n');

async function testPlayDl() {
    try {
        console.log('1️⃣ Test ricerca YouTube...');
        const searchResults = await play.search('never gonna give you up', { 
            limit: 1, 
            source: { youtube: "video" } 
        });

        if (!searchResults || searchResults.length === 0) {
            console.log('❌ Nessun risultato trovato!');
            return;
        }

        const video = searchResults[0];
        console.log('✅ Ricerca funzionante!');
        console.log('   Titolo:', video.title);
        console.log('   URL:', video.url);
        console.log('   Durata:', video.durationInSec, 'secondi\n');

        console.log('2️⃣ Test video_info...');
        const videoInfo = await play.video_info(video.url);
        
        if (!videoInfo || !videoInfo.video_details) {
            console.log('❌ Impossibile ottenere info video!');
            return;
        }

        console.log('✅ video_info funzionante!');
        console.log('   Titolo:', videoInfo.video_details.title);
        console.log('   URL:', videoInfo.video_details.url);
        console.log('   Canale:', videoInfo.video_details.channel?.name || 'N/A\n');

        console.log('3️⃣ Test streaming...');
        const stream = await play.stream(video.url);
        
        if (!stream || !stream.stream) {
            console.log('❌ Impossibile ottenere stream!');
            return;
        }

        console.log('✅ Streaming funzionante!');
        console.log('   Type:', stream.type);
        console.log('   Stream:', typeof stream.stream, '\n');

        // Distruggi stream
        stream.stream.destroy();

        console.log('✅ TUTTI I TEST SUPERATI!\n');
        console.log('play-dl è configurato correttamente! 🎉\n');

    } catch (error) {
        console.error('❌ ERRORE NEL TEST:', error.message);
        console.error('\n💡 Possibili soluzioni:');
        console.error('   1. Installa/Aggiorna play-dl: npm install play-dl@latest');
        console.error('   2. Potrebbe essere necessario configurare cookies YouTube');
        console.error('   3. Controlla la connessione internet\n');
    }
}

testPlayDl();
