# 🤖 Bot Discord Moderazione Avanzato

Bot Discord professionale con sistema completo di moderazione, database MongoDB, comandi slash e grafica Canvas.

## ✨ Caratteristiche

### 🛡️ Sistema di Moderazione Completo
- **Ban/Kick** - Gestione ban temporanei e permanenti
- **Warn System** - Sistema di avvertimenti con tracking
- **Mute** - Silenziamento text/voice/both con durata personalizzabile
- **Timeout** - Sistema di timeout nativo Discord
- **Lock/Unlock** - Blocco canali temporaneo o permanente

### 📊 Statistiche e Leaderboard
- **Profili Utente** - Grafica Canvas personalizzata con statistiche
- **Leaderboard** - Classifica animata con top 10 utenti
- **Stats Server** - Statistiche dettagliate del server
- **Sistema XP/Livelli** - Tracciamento automatico attività

### 🌍 Multilingua
Supporto per 30+ lingue tra cui:
- Italiano, Inglese, Spagnolo, Francese, Tedesco
- Arabo, Cinese, Giapponese, Coreano, Russo
- E molte altre! (vedi comando `/setlang`)

### 💾 Database MongoDB
- Salvataggio permanente di ban, mute, warn
- Statistiche utenti persistenti
- Configurazioni server personalizzate

## 🚀 Installazione

### Prerequisiti
- Node.js v16.9.0 o superiore
- MongoDB (locale o cloud - MongoDB Atlas)
- Un bot Discord (crea su https://discord.com/developers/applications)

### 1. Clona e Installa

```bash
# Clona il repository (o scarica i file)
cd discord-moderation-bot

# Installa le dipendenze
npm install
```

### 2. Configurazione

Crea un file `.env` nella root del progetto:

```env
# Discord Bot Token (ottienilo da https://discord.com/developers/applications)
TOKEN=il_tuo_token_qui

# Client ID del tuo bot
CLIENT_ID=il_tuo_client_id_qui

# MongoDB Connection String
# Opzione 1 - MongoDB Locale:
MONGODB_URI=mongodb://localhost:27017/discord-moderation-bot

# Opzione 2 - MongoDB Atlas (Cloud - CONSIGLIATO):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/discord-moderation-bot

# Configurazioni Opzionali
PREFIX=!
DEFAULT_LANGUAGE=it
```

### 3. MongoDB Setup

#### Opzione A: MongoDB Locale
```bash
# Installa MongoDB sul tuo computer
# Windows: https://www.mongodb.com/try/download/community
# Mac: brew install mongodb-community
# Linux: sudo apt-get install mongodb

# Avvia MongoDB
mongod
```

#### Opzione B: MongoDB Atlas (Cloud - CONSIGLIATO)
1. Vai su https://www.mongodb.com/cloud/atlas
2. Crea un account gratuito
3. Crea un nuovo cluster (tier gratuito disponibile)
4. Crea un database user
5. Ottieni la connection string e inseriscila nel file `.env`

### 4. Invita il Bot

Crea un link di invito con questi permessi:
```
https://discord.com/api/oauth2/authorize?client_id=TUO_CLIENT_ID&permissions=1099511627830&scope=bot%20applications.commands
```

Permessi necessari:
- Gestire Messaggi
- Bannare Membri  
- Espellere Membri
- Moderare Membri (Timeout)
- Gestire Canali
- Gestire Ruoli
- Visualizzare Canali
- Inviare Messaggi
- Gestire Webhooks

### 5. Avvia il Bot

```bash
# Produzione
npm start

# Sviluppo (con auto-restart)
npm run dev
```

## 📝 Comandi Disponibili

### 🛡️ Moderazione
- `/ban <utente> <motivo> [durata]` - Banna un utente
- `/kick <utente> <motivo>` - Espelli un utente
- `/warn <utente> <motivo>` - Avverti un utente
- `/timeout <utente> <durata> <motivo>` - Metti in timeout un utente
- `/mute <utente> <tipo> <durata> <motivo>` - Silenzia un utente (text/voice/both)
- `/unmute <utente> [motivo]` - Riattiva un utente silenziato
- `/lock [canale] [durata] [motivo]` - Blocca un canale
- `/unlock [canale] [motivo]` - Sblocca un canale

### 🔧 Utilità
- `/help` - Mostra tutti i comandi disponibili
- `/invite` - Ottieni il link di invito del bot
- `/stats` - Visualizza statistiche dettagliate del server
- `/profile [utente]` - Visualizza profilo con grafica
- `/leaderboard [tipo]` - Visualizza classifica server
- `/setlang <lingua>` - Imposta la lingua del server

### ⚙️ Amministrazione
- `/warnlist <utente>` - Lista avvertimenti di un utente
- `/banlist` - Lista tutti i ban attivi
- `/clearwarns <utente> [motivo]` - Cancella tutti gli avvertimenti

## 🎨 Esempi di Utilizzo

### Ban Temporaneo
```
/ban @utente motivo:"Spam" durata:7d
```

### Mute Solo Text per 1 ora
```
/mute @utente tipo:text durata:1h motivo:"Flood"
```

### Lock Canale per 30 minuti
```
/lock canale:#generale durata:30m motivo:"Manutenzione"
```

### Visualizza Leaderboard per Messaggi
```
/leaderboard tipo:messages
```

## 🔧 Struttura del Progetto

```
discord-moderation-bot/
├── commands/
│   ├── moderation/     # Comandi di moderazione
│   ├── utility/        # Comandi utility
│   └── admin/          # Comandi amministrativi
├── events/             # Event handlers Discord
├── models/             # Schema MongoDB
├── utils/              # Utility e helper functions
│   ├── canvas.js       # Grafica Canvas
│   ├── helpers.js      # Helper generali
│   └── translations.js # Sistema multilingua
├── index.js            # File principale
├── package.json        # Dipendenze
└── .env                # Configurazione (da creare)
```

## 🛠️ Personalizzazione

### Modificare i Colori degli Embed
Modifica i valori `.setColor()` nei file dei comandi:
```javascript
.setColor('#5865F2') // Blu Discord
.setColor('#FF0000') // Rosso
.setColor('#00FF00') // Verde
```

### Modificare la Grafica Canvas
Modifica `/utils/canvas.js` per personalizzare:
- Colori e gradienti
- Font e dimensioni
- Layout leaderboard e profili

### Aggiungere Nuovi Comandi
1. Crea un nuovo file in `/commands/[categoria]/`
2. Usa la struttura base:
```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('comando')
        .setDescription('Descrizione'),
    
    async execute(interaction) {
        // Il tuo codice qui
    },
};
```

## 🐛 Risoluzione Problemi

### Il bot non si connette
- Verifica che il TOKEN nel file `.env` sia corretto
- Controlla che MongoDB sia in esecuzione
- Verifica i log della console per errori specifici

### I comandi slash non appaiono
- Aspetta fino a 1 ora per la registrazione globale
- Prova a re-invitare il bot con lo scope `applications.commands`
- Verifica che CLIENT_ID sia corretto

### Errori MongoDB
- Verifica la connection string in `.env`
- Controlla che MongoDB sia avviato (locale) o che le credenziali Atlas siano corrette
- Verifica la whitelist IP su MongoDB Atlas

### Canvas non funziona
```bash
# Installazione dipendenze Canvas
# Linux:
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# Mac:
brew install pkg-config cairo pango libpng jpeg giflib librsvg

# Windows:
# Scarica e installa GTK: https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer
```

## 📊 Aggiornamenti Futuri

- [ ] Dashboard web per gestione bot
- [ ] Automod con filtri personalizzabili
- [ ] Sistema di ticket
- [ ] Backup automatici database
- [ ] Integrazioni Twitch/YouTube
- [ ] Sistema economia con shop

## 🤝 Contributi

I contributi sono benvenuti! Apri una issue o una pull request.

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT.

## 💬 Supporto

Per supporto, unisciti al nostro server Discord o apri una issue su GitHub.

---

**Creato con ❤️ per la community Discord italiana**
"# LightBot" 
"# LightBot" 
