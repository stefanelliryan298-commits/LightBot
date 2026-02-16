const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '../../../data/economy.json');

// Assicurati che il file esista
function ensureDataFile() {
    if (!fs.existsSync(dataFile)) {
        fs.mkdirSync(path.dirname(dataFile), { recursive: true });
        fs.writeFileSync(dataFile, JSON.stringify({}));
    }
}

function loadData() {
    ensureDataFileSync();
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

function saveData(data) {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function ensureDataFileSync() {
    ensureDataFile();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hanji')
        .setDescription('🍪 Rivendica i tuoi cookie giornalieri (1 volta al giorno alle 8:00)'),

    cooldown: 3,

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const userId = interaction.user.id;
            const data = loadData();

            // Inizializza utente se non esiste
            if (!data[userId]) {
                data[userId] = {
                    cookies: 0,
                    gems: 0,
                    lastDaily: 0,
                    lootboxes: 0
                };
            }

            const now = new Date();
            const today8AM = new Date();
            today8AM.setHours(8, 0, 0, 0);

            const lastDaily = new Date(data[userId].lastDaily);
            const lastDaily8AM = new Date(lastDaily);
            lastDaily8AM.setHours(8, 0, 0, 0);

            // Controlla se può fare daily
            if (lastDaily8AM.getTime() === today8AM.getTime() && lastDaily.getTime() > today8AM.getTime()) {
                // Ha già fatto il daily oggi
                const nextDaily = new Date(today8AM);
                nextDaily.setDate(nextDaily.getDate() + 1);
                const timeLeft = nextDaily.getTime() - now.getTime();
                const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xFF6B6B)
                            .setTitle('❌ Daily Già Rivendicato')
                            .setDescription(`Hai già rivendicato i tuoi cookie oggi!\nRitorna tra **${hoursLeft}h ${minutesLeft}m**`)
                            .setTimestamp()
                    ]
                });
            }

            // Dai i premi
            const cookieAmount = 500;
            const gemChance = Math.random();
            let gemGiven = false;

            data[userId].cookies += cookieAmount;

            if (gemChance < 0.2) { // 20% di chance di ricevere una gemma
                data[userId].gems += 1;
                gemGiven = true;
            }

            data[userId].lastDaily = now.getTime();
            saveData(data);

            // Crea l'embed di risposta
            const embed = new EmbedBuilder()
                .setColor(0x00FF88)
                .setTitle('✅ Daily Rivendicato!')
                .setDescription(`🍪 Hai ricevuto **${cookieAmount} Cookie**!`)
                .addFields({
                    name: '📊 Totale',
                    value: `🍪 Cookie: **${data[userId].cookies}**\n💎 Gemme: **${data[userId].gems}**`,
                    inline: false
                });

            if (gemGiven) {
                embed.addFields({
                    name: '🎁 Bonus!',
                    value: '✨ Hai ricevuto una **Gemma Fortunata**!',
                    inline: false
                });
            }

            embed.setFooter({ text: 'Ritorna domani alle 8:00 per il prossimo daily!' });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Errore comando /daily:', error);
            try {
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setDescription(`❌ Errore: ${error.message}`)
                    ]
                });
            } catch (replyError) {
                console.error('❌ Impossibile rispondere:', replyError);
            }
        }
    }
};