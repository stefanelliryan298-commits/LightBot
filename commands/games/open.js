const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '../../../data/economy.json');

function ensureDataFile() {
    if (!fs.existsSync(dataFile)) {
        fs.mkdirSync(path.dirname(dataFile), { recursive: true });
        fs.writeFileSync(dataFile, JSON.stringify({}));
    }
}

function loadData() {
    ensureDataFile();
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

function saveData(data) {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// Tipi di gemme
const gemTypes = [
    { name: 'Common Gem', emoji: '💚', minReward: 3000, maxReward: 5000, rarity: 35 },
    { name: 'Uncommon Gem', emoji: '💙', minReward: 5000, maxReward: 10000, rarity: 35 },
    { name: 'Rare Gem', emoji: '💜', minReward: 10000, maxReward: 25000, rarity: 20 },
    { name: 'Epic Gem', emoji: '🧡', minReward: 25000, maxReward: 50000, rarity: 8 },
    { name: 'Legendary Gem', emoji: '❤️', minReward: 50000, maxReward: 100000, rarity: 2 },
];

function getRandomGem() {
    const random = Math.random() * 100;
    let accumulated = 0;

    for (const gem of gemTypes) {
        accumulated += gem.rarity;
        if (random < accumulated) {
            return gem;
        }
    }

    return gemTypes[0]; // Fallback
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('open')
        .setDescription('🎁 Apri una loot box (gemma)')
        .addStringOption(option =>
            option.setName('tipo')
                .setDescription('Che cosa vuoi aprire?')
                .setRequired(true)
                .addChoices(
                    { name: 'Loot Box', value: 'lootbox' },
                    { name: 'Gemma', value: 'gem' }
                )),

    cooldown: 10,

    async execute(interaction) {
        try {
            const tipo = interaction.options.getString('tipo');
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

            const userData = data[userId];

            // Controlla se ha loot box
            if (userData.lootboxes <= 0) {
                return await interaction.reply({
                    content: '❌ Non hai loot box da aprire!\n\nProva `/cookie-flip` per averne una!',
                    ephemeral: true
                });
            }

            // FASE 1: Mostra il messaggio di apertura
            await interaction.deferReply();

            const openingMessage = await interaction.editReply(
                `<:blank:1472658608440348915> **| ${interaction.user.username}** apre una gemma\n<a:shake:1472658137415942334> **|** e sta cercando qualcosa...`
            );

            // FASE 2: Aspetta 2-3 secondi
            await new Promise(resolve => setTimeout(resolve, 2500));

            // Genera la gemma casuale
            const gem = getRandomGem();
            const reward = Math.floor(Math.random() * (gem.maxReward - gem.minReward + 1)) + gem.minReward;

            // FASE 3: Mostra il risultato
            userData.lootboxes -= 1;
            userData.cookies += reward;
            saveData(data);

            const resultMessage = `${gem.emoji} **| ${interaction.user.username}** apre una gemme\n<a:explode:1472658923482779688> **|** e trova un **${gem.name}**!\n\n**+${reward.toLocaleString()}** 🍪\n💰 Totale: **${userData.cookies.toLocaleString()}** 🍪`;

            await openingMessage.edit(resultMessage);

        } catch (error) {
            console.error('❌ Errore comando /open:', error);
            try {
                await interaction.editReply({
                    content: `❌ Errore: ${error.message}`
                });
            } catch (replyError) {
                console.error('❌ Impossibile rispondere:', replyError);
            }
        }
    }
};