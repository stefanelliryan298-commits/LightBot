const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '../../../data/economy.json');

function loadData() {
    try {
        if (!fs.existsSync(dataFile)) {
            return {};
        }
        const content = fs.readFileSync(dataFile, 'utf8');
        return JSON.parse(content || '{}');
    } catch (error) {
        return {};
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rarity')
        .setDescription('📊 Mostra la classifica di cookie e gemme'),

    cooldown: 5,

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const data = loadData();
            const client = interaction.client;

            if (Object.keys(data).length === 0) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xFF6B6B)
                            .setTitle('📊 Classifica Vuota')
                            .setDescription('Nessun utente ha ancora giocato!')
                    ]
                });
            }

            // Crea array di utenti con statistiche
            const users = Object.entries(data).map(([userId, userData]) => ({
                userId,
                cookies: userData.cookies || 0,
                gems: userData.gems || 0
            }));

            // Ordina per cookie
            const topCookies = [...users]
                .sort((a, b) => b.cookies - a.cookies)
                .slice(0, 10);

            // Ordina per gemme
            const topGems = [...users]
                .sort((a, b) => b.gems - a.gems)
                .slice(0, 10);

            // Crea i campi della classifica
            let cookiesField = '';
            for (let i = 0; i < topCookies.length; i++) {
                const user = topCookies[i];
                const member = await interaction.guild.members.fetch(user.userId).catch(() => null);
                const username = member?.displayName || `Unknown#${user.userId.slice(0, 5)}`;
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
                
                cookiesField += `${medal} **${username}**: \`${user.cookies.toLocaleString()}\` 🍪\n`;
            }

            let gemsField = '';
            for (let i = 0; i < topGems.length; i++) {
                const user = topGems[i];
                if (user.gems === 0) continue; // Salta utenti senza gemme
                
                const member = await interaction.guild.members.fetch(user.userId).catch(() => null);
                const username = member?.displayName || `Unknown#${user.userId.slice(0, 5)}`;
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
                
                gemsField += `${medal} **${username}**: \`${user.gems}\` 💎\n`;
            }

            // Se nessuno ha gemme
            if (!gemsField) {
                gemsField = 'Nessuno ha ancora trovato gemme! 😢';
            }

            const embed = new EmbedBuilder()
                .setColor(0x00FFAA)
                .setTitle('📊 Classifica Cookie & Gemme')
                .setDescription(`👥 Server: ${interaction.guild.name}\n\nTop 10 giocatori per cookie e gemme`)
                .addFields(
                    {
                        name: '🍪 Top Cookie',
                        value: cookiesField || 'Nessuno ha cookie',
                        inline: true
                    },
                    {
                        name: '💎 Top Gemme',
                        value: gemsField,
                        inline: true
                    }
                )
                .setThumbnail(interaction.guild.iconURL({ size: 256, dynamic: true }))
                .setTimestamp()
                .setFooter({ text: `Comando richiesto da ${interaction.user.tag}` });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Errore comando /rarity:', error);
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