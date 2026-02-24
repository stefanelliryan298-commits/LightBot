require('dotenv').config();

const play = require('play-dl');

if (process.env.YOUTUBE_COOKIE) {
    play.setToken({
        youtube: {
            cookie: process.env.YOUTUBE_COOKIE
        }
    });
    console.log('✅ play-dl configurato con cookie YouTube\n');
} else {
    console.log('⚠️  YOUTUBE_COOKIE non trovato - play-dl potrebbe essere bloccato\n');
}

const { Client, GatewayIntentBits, Collection, REST, Routes, ActivityType } = require('discord.js');
const antinuke = require('./events/antinuke');
const { Player } = require('discord-player');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════
//  🎵 CONFIGURAZIONE
// ═══════════════════════════════════════════════════════

const config = {
    token: process.env.DISCORD_TOKEN || process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID || null,
    mongodbUri: process.env.MONGODB_URI || process.env.MONGO_URI || null,
    defaultVolume: parseInt(process.env.DEFAULT_VOLUME) || 50,
    disconnectTimeout: parseInt(process.env.DISCONNECT_TIMEOUT) || 300000,
    maxQueueSize: parseInt(process.env.MAX_QUEUE_SIZE) || 100,
    environment: process.env.NODE_ENV || 'production'
};

// Validazione configurazione critica
if (!config.token) {
    console.error('❌ ERRORE: TOKEN non trovato nel file .env!');
    console.log('📝 Aggiungi: DISCORD_TOKEN=il_tuo_token oppure TOKEN=il_tuo_token');
    process.exit(1);
}

if (!config.clientId) {
    console.error('❌ ERRORE: CLIENT_ID non trovato nel file .env!');
    console.log('📝 Aggiungi: CLIENT_ID=il_tuo_client_id');
    process.exit(1);
}

// ═══════════════════════════════════════════════════════
//  🗄️ CONNESSIONE MONGODB
// ═══════════════════════════════════════════════════════

let isMongoConnected = false;

async function connectDB() {
    if (!config.mongodbUri) {
        console.log('ℹ️  MongoDB non configurato (MONGODB_URI assente)\n');
        return;
    }

    console.log('╔════════════════════════════════════════╗');
    console.log('║     🗄️  CONNESSIONE MONGODB            ║');
    console.log('╚════════════════════════════════════════╝\n');

    try {
        await mongoose.connect(config.mongodbUri, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
        });

        isMongoConnected = true;
        console.log('   ✅ MongoDB connesso con successo!');
        console.log(`   📊 Database: ${mongoose.connection.name}\n`);
    } catch (err) {
        console.error('   ❌ Errore connessione MongoDB:', err.message);
        console.log('   🛑 Impossibile avviare senza database. Controlla MONGODB_URI nel .env\n');
        process.exit(1);
    }

    mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnesso, riconnessione in corso...');
        isMongoConnected = false;
        setTimeout(connectDB, 5000);
    });

    mongoose.connection.on('error', err => {
        console.error('❌ MongoDB errore runtime:', err.message);
    });
}

// ═══════════════════════════════════════════════════════
//  🤖 INIZIALIZZAZIONE CLIENT DISCORD
// ═══════════════════════════════════════════════════════

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration,
    ]
});

client.commands  = new Collection();
client.cooldowns = new Collection();
client.queues    = new Map();
client.voiceConnections = new Map();
client.config    = config;

// ═══════════════════════════════════════════════════════
//  📁 CARICAMENTO COMANDI
// ═══════════════════════════════════════════════════════

console.log('\n╔════════════════════════════════════════╗');
console.log('║     📁 CARICAMENTO COMANDI             ║');
console.log('╚════════════════════════════════════════╝\n');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

function loadCommands(dir, folderName = '') {
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
            console.log(`   📂 Cartella: ${item}/`);
            loadCommands(itemPath, item);
        } else if (item.endsWith('.js')) {
            try {
                const command = require(itemPath);

                if ('data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);
                    commands.push(command.data.toJSON());

                    const displayPath  = folderName ? `${folderName}/${item}` : item;
                    const cooldown     = command.cooldown     ? `⏱️${command.cooldown}s` : '';
                    const permissions  = command.permissions  ? '🔒' : '';
                    console.log(`   ✅ /${command.data.name.padEnd(15)} ${permissions}${cooldown} - ${displayPath}`);
                } else {
                    console.log(`   ⚠️  ${item} - Manca 'data' o 'execute'`);
                }
            } catch (error) {
                console.error(`   ❌ Errore caricando ${item}:`, error.message);
            }
        }
    }
}

if (fs.existsSync(commandsPath)) {
    loadCommands(commandsPath);
} else {
    console.log('   ⚠️  Cartella commands/ non trovata!');
}

const commandNames = commands.map(cmd => cmd.name);
const duplicates = commandNames.filter((name, index) => commandNames.indexOf(name) !== index);
if (duplicates.length > 0) {
    console.log('\n   ⚠️  COMANDI DUPLICATI TROVATI:', [...new Set(duplicates)]);
}

console.log(`\n   📊 Totale comandi caricati: ${commands.length}\n`);

// ═══════════════════════════════════════════════════════
//  📂 CARICAMENTO EVENTI
// ═══════════════════════════════════════════════════════

console.log('╔════════════════════════════════════════╗');
console.log('║     📂 CARICAMENTO EVENTI              ║');
console.log('╚════════════════════════════════════════╝\n');

const eventsPath = path.join(__dirname, 'events');

if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        try {
            const filePath = path.join(eventsPath, file);
            const event    = require(filePath);

            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }

            const badge = event.once ? '🔵' : '🟢';
            console.log(`   ${badge} ${event.name.padEnd(25)} - ${file}`);
        } catch (error) {
            console.error(`   ❌ Errore caricando evento ${file}:`, error.message);
        }
    }
} else {
    console.log('   ⚠️  Cartella events/ non trovata!');
}

console.log('');

// ═══════════════════════════════════════════════════════
//  🎵 BOT READY
// ═══════════════════════════════════════════════════════

client.once('clientReady', async () => {
    console.log('╔════════════════════════════════════════╗');
    console.log(`║  ✅ Bot Online: ${client.user.tag.padEnd(22)} ║`);
    console.log(`║  🌐 Server: ${client.guilds.cache.size.toString().padEnd(26)} ║`);
    console.log(`║  👤 Utenti: ${client.users.cache.size.toString().padEnd(26)} ║`);
    console.log(`║  ⚙️  Ambiente: ${config.environment.padEnd(24)} ║`);
    console.log(`║  🗄️  MongoDB: ${(isMongoConnected ? 'Connesso ✅' : 'Non configurato').padEnd(24)} ║`);
    console.log('╚════════════════════════════════════════╝\n');

    // ── Anti-Nuke (registrazione manuale multi-evento) ──────────────────────
    antinuke.register(client);
    console.log('   🛡️  Anti-Nuke registrato!\n');

    // ── Anti-Raid reset event ───────────────────────────────────────────────
    const guildMemberAddEvent = require('./events/guildMemberAdd');
    client.on('antiraidReset', (guildId) => {
        guildMemberAddEvent.resetGuild(guildId);
    });

   /* 
    // ========== INIZIALIZZA DISCORD PLAYER ==========
    console.log('╔════════════════════════════════════════╗');
    console.log('║     🎵 DISCORD PLAYER SETUP            ║');
    console.log('╚════════════════════════════════════════╝\n');
    
    try {
        const player = new Player(client, {
            ytdlOptions: {
                quality: 'highestaudio',
                highWaterMark: 1 << 25,
                filter: 'audioonly',
                requestOptions: {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                }
            }
        });

        console.log('   🔄 Caricamento estrattori...\n');

        try {
            const { YoutubeiExtractor } = require('discord-player-youtubei');
            await player.extractors.register(YoutubeiExtractor, {
                authentication: process.env.YOUTUBE_COOKIE || undefined
            });
            console.log('   ✅ Estrattore YouTubei registrato!\n');
        } catch (youtubeError) {
            console.log('   ⚠️  YouTubei non disponibile, provo estrattori default...');
            try {
                const { DefaultExtractors } = require('@discord-player/extractor');
                await player.extractors.loadMulti(DefaultExtractors);
                console.log('   ✅ Estrattori default caricati!\n');
            } catch (defaultError) {
                console.error('   ❌ Impossibile caricare estrattori:', defaultError.message);
            }
        }

        client.player = player;

        player.events.on('playerStart',    (queue, track)  => { if (queue.metadata?.channel) queue.metadata.channel.send(`🎶 Ora in riproduzione: **${track.title}**`); });
        player.events.on('audioTracksAdd', (queue, tracks) => { if (queue.metadata?.channel) queue.metadata.channel.send(`✅ Aggiunte **${tracks.length}** canzoni alla coda!`); });
        player.events.on('disconnect',     (queue)         => { if (queue.metadata?.channel) queue.metadata.channel.send('👋 Disconnesso dal canale vocale!'); });
        player.events.on('emptyChannel',   (queue)         => { if (queue.metadata?.channel) queue.metadata.channel.send('💤 Canale vuoto, mi disconnetto...'); });
        player.events.on('emptyQueue',     (queue)         => { if (queue.metadata?.channel) queue.metadata.channel.send('✅ Coda terminata!'); });
        player.events.on('error',          (queue, error)  => { if (queue?.metadata?.channel) queue.metadata.channel.send('❌ Errore durante la riproduzione!'); });
        player.events.on('playerError',    (queue, error)  => { if (queue?.metadata?.channel) queue.metadata.channel.send('❌ Errore durante la riproduzione del brano!'); });

        console.log('   ✅ Discord Player inizializzato!\n');
    } catch (error) {
        console.error('   ❌ Errore inizializzazione Discord Player:', error.message);
        console.log('   ⚠️  I comandi musicali potrebbero non funzionare!\n');
    }
    */

    await deployCommands();

    client.user.setPresence({
        activities: [{ name: '🎵 /play | /help', type: ActivityType.Listening }],
        status: 'online'
    });

    console.log('╔════════════════════════════════════════╗');
    console.log('║     🎉 BOT COMPLETAMENTE PRONTO!       ║');
    console.log('╚════════════════════════════════════════╝\n');
});

// ═══════════════════════════════════════════════════════
//  ⚡ DEPLOY COMANDI SLASH
// ═══════════════════════════════════════════════════════

async function deployCommands() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║     ⚡ DEPLOY SLASH COMMANDS           ║');
    console.log('╚════════════════════════════════════════╝\n');

    const rest = new REST({ version: '10' }).setToken(config.token);

    try {
        console.log(`   🔄 Deploy di ${commands.length} comandi...`);

        if (config.environment === 'development' && config.guildId) {
            console.log(`   🔧 Modalità DEVELOPMENT - Deploy nel server ${config.guildId}`);
            await rest.put(
                Routes.applicationGuildCommands(config.clientId, config.guildId),
                { body: commands }
            );
            console.log('   ✅ Comandi registrati nel server di sviluppo!');
        } else {
            console.log('   🌐 Modalità PRODUCTION - Deploy globale');
            await rest.put(
                Routes.applicationCommands(config.clientId),
                { body: commands }
            );
            console.log('   ✅ Comandi registrati globalmente!');
            console.log('   ⏱️  Potrebbero volerci fino a 1 ora per propagarsi');
        }

        console.log(`   📊 ${commands.length} comandi deployati con successo!\n`);

    } catch (error) {
        console.error('   ❌ Errore durante il deploy:', error);

        if (error.code === 50001)         console.log('   💡 Il bot non ha accesso al server specificato');
        else if (error.code === 30034)    console.log('   💡 Limite di 200 comandi slash raggiunto');
        else if (error.rawError?.message) console.log('   💡', error.rawError.message);

        console.log('');
    }
}

// ═══════════════════════════════════════════════════════
//  🚨 GESTIONE ERRORI GLOBALI
// ═══════════════════════════════════════════════════════

process.on('unhandledRejection', (error) => {
    console.error('\n❌ [UNHANDLED REJECTION]');
    console.error('Errore:', error);
    if (error.stack) console.error('Stack:', error.stack);
});

process.on('uncaughtException', (error) => {
    console.error('\n❌ [UNCAUGHT EXCEPTION]');
    console.error('Errore:', error);
    if (error.stack) console.error('Stack:', error.stack);
    console.log('\n🛑 Il bot verrà terminato per sicurezza...');
    setTimeout(() => process.exit(1), 1000);
});

process.on('SIGINT',  async () => { console.log('\n\n🛑 SIGINT ricevuto...');  await cleanup(); });
process.on('SIGTERM', async () => { console.log('\n\n🛑 SIGTERM ricevuto...'); await cleanup(); });

async function cleanup() {
    console.log('   🔄 Chiusura connessioni...');

    if (client.player) {
        client.player.nodes.cache.forEach(queue => {
            try { queue.delete(); } catch (e) {}
        });
    }

    client.destroy();
    console.log('   ✅ Discord disconnesso');

    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log('   ✅ MongoDB disconnesso');
    }

    console.log('   ✅ Chiusura completata!\n');
    process.exit(0);
}

// ═══════════════════════════════════════════════════════
//  🚀 AVVIO — MongoDB prima, poi il bot
// ═══════════════════════════════════════════════════════

console.log('╔════════════════════════════════════════╗');
console.log('║     🚀 AVVIO BOT                       ║');
console.log('╚════════════════════════════════════════╝\n');

(async () => {
    // 1️⃣ Prima connetti MongoDB (se configurato)
    await connectDB();

    // 2️⃣ Poi autentica il bot su Discord
    console.log('   🔐 Autenticazione in corso...');
    try {
        await client.login(config.token);
        console.log('   ✅ Token valido!');
        console.log('   🔄 Connessione a Discord...\n');
    } catch (error) {
        console.error('\n   ❌ ERRORE LOGIN:', error.message);
        console.log('\n   💡 Soluzioni possibili:');
        console.log('      1. Verifica che TOKEN o DISCORD_TOKEN sia corretto nel .env');
        console.log('      2. Verifica che il bot sia abilitato nel Developer Portal');
        console.log('      3. Rigenera il token se necessario\n');
        process.exit(1);
    }
})();