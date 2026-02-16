// fix-discord-player.js
// Script per verificare e configurare discord-player correttamente

console.log('🔧 FIX DISCORD PLAYER\n');
console.log('═══════════════════════════════════════════════════\n');

console.log('❌ PROBLEMA: discord-player riproduce ma termina subito\n');
console.log('✅ CAUSA: Estrattori YouTube non configurati correttamente\n');

console.log('📦 SOLUZIONE 1 - Installa estrattori (CONSIGLIATO):');
console.log('─────────────────────────────────────────────────────\n');
console.log('   npm install @discord-player/extractor');
console.log('   npm install ytdl-core');
console.log('   npm install youtube-ext\n');

console.log('📝 SOLUZIONE 2 - Aggiorna index.js:');
console.log('─────────────────────────────────────────────────────\n');
console.log('Sostituisci le righe 210-215 del tuo index.js con:\n');

console.log('```javascript');
console.log('console.log("   🔄 Caricamento estrattori...");');
console.log('');
console.log('try {');
console.log('    // Prova a caricare estrattori default');
console.log('    const { DefaultExtractors } = require("@discord-player/extractor");');
console.log('    await player.extractors.loadMulti(DefaultExtractors);');
console.log('    console.log("   ✅ Estrattori default caricati!");');
console.log('} catch (error) {');
console.log('    console.log("   ⚠️  Estrattori default non disponibili, uso built-in");');
console.log('    ');
console.log('    // Usa estrattori built-in come fallback');
console.log('    await player.extractors.loadDefault((ext) => ext !== "YouTubeExtractor");');
console.log('    console.log("   ✅ Estrattori built-in caricati!");');
console.log('}');
console.log('```\n');

console.log('📝 SOLUZIONE 3 - Usa estrattore alternativo:');
console.log('─────────────────────────────────────────────────────\n');
console.log('Se hai ancora problemi, usa play-dl come estrattore:\n');
console.log('```javascript');
console.log('const { YoutubeiExtractor } = require("discord-player-youtubei");');
console.log('await player.extractors.register(YoutubeiExtractor, {});');
console.log('```\n');
console.log('Installalo con: npm install discord-player-youtubei\n');

console.log('═══════════════════════════════════════════════════\n');
console.log('💡 TI CONSIGLIO:\n');
console.log('1. npm install @discord-player/extractor ytdl-core youtube-ext');
console.log('2. Riavvia il bot');
console.log('3. Prova /play\n');

console.log('🔍 Verifica pacchetti installati:\n');

const packages = [
    'discord-player',
    '@discord-player/extractor',
    'ytdl-core',
    'youtube-ext',
    'play-dl'
];

for (const pkg of packages) {
    try {
        require.resolve(pkg);
        console.log(`   ✅ ${pkg}`);
    } catch (error) {
        console.log(`   ❌ ${pkg} - NON INSTALLATO`);
    }
}

console.log('\n');
