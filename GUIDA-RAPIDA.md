# 🚀 GUIDA RAPIDA - Avvio in 5 Minuti

## 📋 Prima di Iniziare

### 1. Crea il Bot su Discord
1. Vai su https://discord.com/developers/applications
2. Clicca "New Application"
3. Dai un nome al bot
4. Vai su "Bot" nella sidebar
5. Clicca "Add Bot"
6. Copia il TOKEN (lo userai dopo)
7. Vai su "OAuth2" > "General"
8. Copia il CLIENT ID

### 2. Installa MongoDB
**Opzione Facile - MongoDB Atlas (Cloud Gratuito):**
1. Vai su https://www.mongodb.com/cloud/atlas/register
2. Crea un account gratuito
3. Crea un cluster (seleziona il tier gratuito M0)
4. Crea un Database User (username e password)
5. Aggiungi il tuo IP alla whitelist (o usa 0.0.0.0/0 per tutti)
6. Clicca "Connect" > "Connect your application"
7. Copia la connection string

**Opzione Locale - MongoDB Installato:**
```bash
# Windows: Scarica da https://www.mongodb.com/try/download/community
# Mac: brew install mongodb-community
# Linux: sudo apt-get install mongodb

# Avvia MongoDB
mongod
```

## ⚙️ Configurazione Rapida

### 1. Installa Node.js
Scarica da: https://nodejs.org/ (versione LTS)

### 2. Installa Dipendenze
```bash
cd discord-moderation-bot
npm install
```

### 3. Configura il Bot
Crea un file chiamato `.env` nella cartella principale con questo contenuto:

```env
# Il token del tuo bot Discord
TOKEN=METTI_QUI_IL_TUO_TOKEN

# Il client ID del tuo bot
CLIENT_ID=METTI_QUI_IL_CLIENT_ID

# MongoDB Connection String
# Se usi MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/discord-moderation-bot

# Se usi MongoDB locale:
# MONGODB_URI=mongodb://localhost:27017/discord-moderation-bot

# Configurazioni opzionali
PREFIX=!
DEFAULT_LANGUAGE=it
```

**⚠️ IMPORTANTE:** Sostituisci:
- `METTI_QUI_IL_TUO_TOKEN` con il token copiato prima
- `METTI_QUI_IL_CLIENT_ID` con il client ID copiato prima
- `username:password` con le credenziali MongoDB Atlas
- `cluster.mongodb.net` con il tuo cluster Atlas

## 🎯 Invita il Bot

Usa questo link (sostituisci TUO_CLIENT_ID):
```
https://discord.com/api/oauth2/authorize?client_id=TUO_CLIENT_ID&permissions=1099511627830&scope=bot%20applications.commands
```

## ▶️ Avvia il Bot

```bash
npm start
```

Dovresti vedere:
```
✅ Caricato comando: ban
✅ Caricato comando: kick
...
✅ Connesso a MongoDB
🤖 Bot online come NomeBot#1234!
✅ Comandi slash registrati con successo!
```

## 🎉 Prova il Bot

Nel tuo server Discord, digita:
```
/help
```

Se vedi il menu del bot, **COMPLIMENTI! 🎊** Il bot funziona!

## 📚 Comandi Principali

### Moderazione Base
```
/ban @utente motivo:"Spam" durata:7d
/kick @utente motivo:"Flood"
/warn @utente motivo:"Linguaggio inappropriato"
/timeout @utente durata:1h motivo:"Timeout"
```

### Mute
```
/mute @utente tipo:text durata:1h motivo:"Spam"
/mute @utente tipo:voice durata:30m motivo:"Disturbo vocale"
/mute @utente tipo:both durata:1d motivo:"Violazione regole"
/unmute @utente
```

### Lock/Unlock Canali
```
/lock canale:#generale durata:30m motivo:"Manutenzione"
/unlock canale:#generale
```

### Statistiche
```
/stats                    # Statistiche server
/profile @utente          # Profilo utente con grafica
/leaderboard tipo:xp      # Classifica server
```

### Gestione
```
/warnlist @utente         # Lista avvertimenti
/banlist                  # Lista ban attivi
/clearwarns @utente       # Cancella avvertimenti
/setlang lingua:it        # Imposta lingua italiana
```

## 🔧 Problemi Comuni

### "Invalid Token"
- Verifica di aver copiato correttamente il TOKEN nel file .env
- Assicurati che non ci siano spazi prima o dopo il token
- Rigenera il token su Discord Developer Portal

### "Cannot connect to MongoDB"
- Verifica la connection string in .env
- Se usi Atlas, controlla che il tuo IP sia nella whitelist
- Se usi locale, assicurati che MongoDB sia in esecuzione (`mongod`)

### "Command not found"
- Aspetta fino a 1 ora per la registrazione dei comandi
- Prova a kickare e re-invitare il bot
- Verifica che il bot abbia i permessi corretti

### Canvas Errors (Windows)
Se hai errori con Canvas su Windows:
1. Scarica: https://github.com/Automattic/node-canvas/releases
2. Oppure commenta temporaneamente i comandi che usano Canvas (/profile, /leaderboard)

## 📞 Supporto

Se hai problemi:
1. Controlla i log nella console
2. Verifica che tutte le dipendenze siano installate
3. Leggi il README.md completo
4. Cerca l'errore su Google/StackOverflow

## 🎓 Prossimi Passi

1. Personalizza i colori e la grafica
2. Aggiungi il tuo server di supporto nel comando /invite
3. Configura un canale per i log
4. Crea ruoli VIP personalizzati
5. Esplora e personalizza i comandi

**Buon divertimento con il tuo bot! 🚀**
