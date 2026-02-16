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
    try {
        const content = fs.readFileSync(dataFile, 'utf8');
        return JSON.parse(content || '{}');
    } catch (error) {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// Tipi di gemme (rarità molto bassa)
const gemTypes = [
    { name: 'Common Gem', emoji: '💚', rarity: 0.5 },      // 0.5%
    { name: 'Uncommon Gem', emoji: '💙', rarity: 0.2 },    // 0.2%
    { name: 'Rare Gem', emoji: '💜', rarity: 0.05 },       // 0.05%
    { name: 'Epic Gem', emoji: '🧡', rarity: 0.02 },       // 0.02%
    { name: 'Legendary Gem', emoji: '❤️', rarity: 0.01 },  // 0.01%
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

    return null; // Nessuna gemma
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cookie-flip')
        .setDescription('🍪 Scommetti i tuoi cookie!')
        .addNumberOption(option =>
            option.setName('importo')
                .setDescription('Quanti cookie vuoi scommettere?')
                .setRequired(true)
                .setMinValue(1)),

    cooldown: 8,

    async execute(interaction) {
        try {
            const userId = interaction.user.id;
            const amount = Math.floor(interaction.options.getNumber('importo'));
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

            // Controlla se ha abbastanza cookie
            if (userData.cookies < amount) {
                return await interaction.reply({
                    content: `❌ Non hai abbastanza cookie!\n🍪 Hai: **${userData.cookies}**\n🎲 Richiesti: **${amount}**`,
                    ephemeral: true
                });
            }

            // FASE 1: Mostra il messaggio di apertura
            await interaction.deferReply();

            const openingMessage = await interaction.editReply(
                `<:blank:1472658608440348915> **| ${interaction.user.username}** scommette **${amount}** 🍪\n<a:shake:1472667696339619996> **|** e sta cercando fortuna...`
            );

            // FASE 2: Aspetta 2-3 secondi
            await new Promise(resolve => setTimeout(resolve, 2500));

            // Genera risultato casuale
            const randomResult = Math.random() * 100;
            let result, winAmount, gemWon = null;

            if (randomResult < 50) {
                // 50% - VINCI (amount random da 0.5x a 3x)
                result = 'WIN';
                const multiplier = 0.5 + (Math.random() * 2.5); // 0.5x - 3x
                winAmount = Math.floor(amount * multiplier);
                userData.cookies += winAmount;
            } else if (randomResult < 95) {
                // 45% - PERDI (amount random)
                result = 'LOSE';
                winAmount = Math.floor(amount * (0.5 + Math.random() * 1.5)); // perdi tra 50% e 150%
                userData.cookies -= winAmount;
            } else {
                // 5% - JACKPOT CON GEMMA (rarità molto bassa)
                const gemChance = Math.random() * 100;
                const totalGemRarity = gemTypes.reduce((sum, g) => sum + g.rarity, 0);
                
                if (gemChance < totalGemRarity) {
                    // Vinci una gemma!
                    result = 'GEM';
                    gemWon = getRandomGem();
                    winAmount = Math.floor(amount * (2 + Math.random() * 3)); // 2x - 5x
                    userData.cookies += winAmount;
                    userData.gems += 1;
                } else {
                    // Jackpot senza gemma
                    result = 'JACKPOT';
                    winAmount = Math.floor(amount * (3 + Math.random() * 5)); // 3x - 8x
                    userData.cookies += winAmount;
                }
            }

            saveData(data);

            // FASE 3: Mostra il risultato
            let resultMessage = '';

            if (result === 'WIN') {
                resultMessage = `<:blank:1472658608440348915> **| ${interaction.user.username}** scommette **${amount}** 🍪\n<a:explode:1472658923482779688> **|** e VINCE **${winAmount}** 🍪!\n\n✅ Totale: **${userData.cookies.toLocaleString()}** 🍪`;
            } else if (result === 'LOSE') {
                resultMessage = `<:blank:1472658608440348915> **| ${interaction.user.username}** scommette **${amount}** 🍪\n<a:explode:1472658923482779688> **|** e PERDE **${winAmount}** 🍪...\n\n❌ Totale: **${userData.cookies.toLocaleString()}** 🍪`;
            } else if (result === 'JACKPOT') {
                resultMessage = `<:blank:1472658608440348915> **| ${interaction.user.username}** scommette **${amount}** 🍪\n<a:explode:1472658923482779688> **|** e vince un JACKPOT di **${winAmount}** 🍪!!!\n\n🎉 Totale: **${userData.cookies.toLocaleString()}** 🍪`;
            } else if (result === 'GEM') {
                resultMessage = `<:blank:1472658608440348915> **| ${interaction.user.username}** scommette **${amount}** 🍪\n<a:explode:1472658923482779688> **|** e trova una **${gemWon.name}** ${gemWon.emoji}!\n\n${gemWon.emoji} Totale: **${userData.cookies.toLocaleString()}** 🍪\n💎 Gemme: **${userData.gems}**`;
            }

            await openingMessage.edit(resultMessage);

        } catch (error) {
            console.error('❌ Errore comando /cookie-flip:', error);
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