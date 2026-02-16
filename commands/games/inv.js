const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inv')
        .setDescription('🎒 Mostra il tuo inventario')
        .addUserOption(option =>
            option.setName('utente')
                .setDescription('Visualizza inventario di un altro utente')
                .setRequired(false)),

    cooldown: 3,

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const targetUser = interaction.options.getUser('utente') || interaction.user;
            const userId = targetUser.id;
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

            const embed = new EmbedBuilder()
                .setColor(0x00FFAA)
                .setTitle(`🎒 Inventario di ${targetUser.username}`)
                .setThumbnail(targetUser.displayAvatarURL({ size: 256, dynamic: true }))
                .addFields(
                    {
                        name: '🍪 Cookie',
                        value: `**${userData.cookies.toLocaleString()}**`,
                        inline: true
                    },
                    {
                        name: '💎 Gemme',
                        value: `**${userData.gems}**`,
                        inline: true
                    },
                    {
                        name: '📦 Loot Box',
                        value: `**${userData.lootboxes}**`,
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({ text: `ID: ${targetUser.id}` });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Errore comando /inv:', error);
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