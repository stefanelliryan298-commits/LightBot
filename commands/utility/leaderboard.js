const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const UserStats = require('../../models/UserStats');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Visualizza la classifica del server con grafica professionale')
        .addStringOption(option =>
            option.setName('tipo')
                .setDescription('Tipo di classifica')
                .setRequired(false)
                .addChoices(
                    { name: '🏆 XP Totale', value: 'xp' },
                    { name: '💬 Messaggi', value: 'messages' },
                    { name: '🎤 Minuti Vocali', value: 'voice' },
                    { name: '⭐ Livello', value: 'level' }
                ))
        .addStringOption(option =>
            option.setName('stile')
                .setDescription('Stile grafico')
                .setRequired(false)
                .addChoices(
                    { name: '🎨 Moderno', value: 'modern' },
                    { name: '🌌 Spaziale', value: 'space' },
                    { name: '🌈 Neon', value: 'neon' },
                    { name: '💎 Cristallo', value: 'crystal' }
                )),
    
    cooldown: 15,

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const sortType = interaction.options.getString('tipo') || 'xp';
            const style = interaction.options.getString('stile') || 'modern';

            // Configurazione tipi
            const sortFields = {
                'xp': { field: 'xp', name: 'XP', emoji: '🏆', color: '#FFD700' },
                'messages': { field: 'messages', name: 'Messaggi', emoji: '💬', color: '#5865F2' },
                'voice': { field: 'voiceMinutes', name: 'Minuti Vocali', emoji: '🎤', color: '#57F287' },
                'level': { field: 'level', name: 'Livello', emoji: '⭐', color: '#FEE75C' }
            };

            const sortConfig = sortFields[sortType];

            // Recupera utenti
            const topUsers = await UserStats.find({ guildId: interaction.guild.id })
                .sort({ [sortConfig.field]: -1 })
                .limit(10)
                .lean();

            if (topUsers.length === 0) {
                return interaction.editReply('❌ Non ci sono ancora statistiche disponibili!');
            }

            // Aggiorna info utenti
            for (let user of topUsers) {
                try {
                    const member = await interaction.guild.members.fetch(user.userId).catch(() => null);
                    if (member) {
                        user.username = member.user.username;
                        user.avatar = member.user.displayAvatarURL({ extension: 'png', size: 256 });
                    } else {
                        user.username = user.username || 'Utente Sconosciuto';
                        user.avatar = null;
                    }
                } catch (error) {
                    user.username = user.username || 'Utente Sconosciuto';
                    user.avatar = null;
                }
            }

            // Crea immagine con stile selezionato
            const leaderboardImage = await this.createStyledLeaderboard(
                topUsers,
                interaction.guild.name,
                sortConfig,
                style
            );

            const attachment = new AttachmentBuilder(leaderboardImage, { 
                name: 'leaderboard.png' 
            });

            // Posizione utente
            const allUsers = await UserStats.find({ guildId: interaction.guild.id })
                .sort({ [sortConfig.field]: -1 })
                .lean();

            const userPosition = allUsers.findIndex(u => u.userId === interaction.user.id) + 1;
            const userStats = allUsers[userPosition - 1];

            const embed = new EmbedBuilder()
                .setColor(sortConfig.color)
                .setTitle(`${sortConfig.emoji} Classifica ${sortConfig.name}`)
                .setDescription(`**Top 10** • Stile: ${this.getStyleName(style)}`)
                .setImage('attachment://leaderboard.png');

            if (userStats && userPosition > 0) {
                const medal = userPosition === 1 ? '🥇' : userPosition === 2 ? '🥈' : userPosition === 3 ? '🥉' : '📊';
                embed.addFields({
                    name: '📍 La Tua Posizione',
                    value: `${medal} **#${userPosition}** • Lvl ${userStats.level} • ${userStats[sortConfig.field].toLocaleString()} ${sortConfig.name}`,
                    inline: false
                });
            }

            embed.setFooter({ 
                text: `Richiesto da ${interaction.user.tag}`, 
                iconURL: interaction.user.displayAvatarURL() 
            })
            .setTimestamp();

            await interaction.editReply({ 
                embeds: [embed],
                files: [attachment]
            });

        } catch (error) {
            console.error('Errore leaderboard:', error);
            await interaction.editReply('❌ Errore nella creazione della classifica!');
        }
    },

    getStyleName(style) {
        const styles = {
            'modern': '🎨 Moderno',
            'space': '🌌 Spaziale',
            'neon': '🌈 Neon',
            'crystal': '💎 Cristallo'
        };
        return styles[style] || styles['modern'];
    },

    async createStyledLeaderboard(users, guildName, sortConfig, style) {
        const width = 1200;
        const height = 900;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Applica stile
        switch (style) {
            case 'space':
                this.drawSpaceStyle(ctx, width, height);
                break;
            case 'neon':
                this.drawNeonStyle(ctx, width, height);
                break;
            case 'crystal':
                this.drawCrystalStyle(ctx, width, height);
                break;
            default:
                this.drawModernStyle(ctx, width, height);
        }

        // Header
        await this.drawHeader(ctx, width, guildName, sortConfig, style);

        // User cards
        await this.drawUserCards(ctx, users, width, sortConfig, style);

        // Footer
        this.drawFooter(ctx, width, height, users.length, style);

        return canvas.toBuffer('image/png');
    },

    // STILI DI SFONDO

    drawModernStyle(ctx, width, height) {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Pattern
        ctx.globalAlpha = 0.05;
        for (let i = 0; i < 50; i++) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
        }
        ctx.globalAlpha = 1;
    },

    drawSpaceStyle(ctx, width, height) {
        // Sfondo nero spaziale
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        // Stelle multiple dimensioni
        ctx.globalAlpha = 0.8;
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 2 + 0.5;
            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Nebulosa viola/blu
        const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
        gradient.addColorStop(0, 'rgba(138, 43, 226, 0.2)');
        gradient.addColorStop(0.5, 'rgba(75, 0, 130, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1;
    },

    drawNeonStyle(ctx, width, height) {
        // Sfondo scuro
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, width, height);

        // Griglia neon
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
        ctx.lineWidth = 1;
        
        // Linee verticali
        for (let x = 0; x < width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Linee orizzontali
        for (let y = 0; y < height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Effetto glow overlay
        const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 0, 255, 0.1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    },

    drawCrystalStyle(ctx, width, height) {
        // Sfondo gradiente chiaro
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#e0f7fa');
        gradient.addColorStop(0.5, '#b2ebf2');
        gradient.addColorStop(1, '#80deea');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Pattern cristallino
        ctx.globalAlpha = 0.1;
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 100 + 50;
            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(x, y - size/2);
            ctx.lineTo(x + size/2, y);
            ctx.lineTo(x, y + size/2);
            ctx.lineTo(x - size/2, y);
            ctx.closePath();
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    },

    // HEADER

    async drawHeader(ctx, width, guildName, sortConfig, style) {
        const headerHeight = 120;
        
        // Background header basato su stile
        if (style === 'space') {
            const gradient = ctx.createLinearGradient(0, 0, 0, headerHeight);
            gradient.addColorStop(0, 'rgba(138, 43, 226, 0.8)');
            gradient.addColorStop(1, 'rgba(75, 0, 130, 0.6)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, headerHeight);
        } else if (style === 'neon') {
            ctx.shadowColor = '#ff00ff';
            ctx.shadowBlur = 40;
            ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
            ctx.fillRect(0, 0, width, headerHeight);
            ctx.shadowBlur = 0;
        } else if (style === 'crystal') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(0, 0, width, headerHeight);
        } else {
            ctx.shadowColor = sortConfig.color;
            ctx.shadowBlur = 30;
            ctx.fillStyle = sortConfig.color;
            ctx.fillRect(0, 0, width, headerHeight);
            ctx.shadowBlur = 0;
        }

        // Overlay
        const overlay = ctx.createLinearGradient(0, 0, 0, headerHeight);
        overlay.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
        overlay.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, width, headerHeight);

        // Titolo
        ctx.fillStyle = style === 'crystal' ? '#000000' : '#FFFFFF';
        ctx.font = 'bold 48px Arial, sans-serif';
        ctx.textAlign = 'center';
        
        if (style === 'neon') {
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 20;
        }
        
        ctx.fillText(`${sortConfig.emoji} ${guildName}`, width / 2, 55);
        
        ctx.font = 'bold 28px Arial, sans-serif';
        ctx.fillStyle = style === 'crystal' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)';
        ctx.fillText(`Classifica ${sortConfig.name}`, width / 2, 95);
        ctx.shadowBlur = 0;
    },

    // USER CARDS

    async drawUserCards(ctx, users, width, sortConfig, style) {
        const cardStartY = 150;
        const cardHeight = 70;
        const cardMargin = 5;

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const y = cardStartY + (i * (cardHeight + cardMargin));
            await this.drawUserCard(ctx, user, i, y, width, cardHeight, sortConfig, style);
        }
    },

    async drawUserCard(ctx, user, position, y, width, cardHeight, sortConfig, style) {
        // Card color basato su stile
        let cardColor, borderColor = null;

        if (style === 'space') {
            if (position < 3) {
                cardColor = position === 0 ? 'rgba(255, 215, 0, 0.2)' : 
                           position === 1 ? 'rgba(192, 192, 192, 0.2)' : 
                           'rgba(205, 127, 50, 0.2)';
                borderColor = position === 0 ? '#FFD700' : position === 1 ? '#C0C0C0' : '#CD7F32';
            } else {
                cardColor = 'rgba(138, 43, 226, 0.2)';
            }
        } else if (style === 'neon') {
            cardColor = 'rgba(0, 0, 0, 0.7)';
            if (position < 3) {
                borderColor = position === 0 ? '#00ffff' : position === 1 ? '#ff00ff' : '#ffff00';
            }
        } else if (style === 'crystal') {
            if (position < 3) {
                cardColor = 'rgba(255, 255, 255, 0.95)';
                borderColor = position === 0 ? '#FFD700' : position === 1 ? '#C0C0C0' : '#CD7F32';
            } else {
                cardColor = 'rgba(255, 255, 255, 0.8)';
            }
        } else {
            // Modern
            if (position < 3) {
                cardColor = position === 0 ? 'rgba(255, 215, 0, 0.15)' : 
                           position === 1 ? 'rgba(192, 192, 192, 0.15)' : 
                           'rgba(205, 127, 50, 0.15)';
                borderColor = position === 0 ? '#FFD700' : position === 1 ? '#C0C0C0' : '#CD7F32';
            } else {
                cardColor = 'rgba(255, 255, 255, 0.08)';
            }
        }

        // Shadow
        if (style !== 'neon') {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetY = 5;
        }

        // Card background
        ctx.fillStyle = cardColor;
        this.roundRect(ctx, 50, y, width - 100, cardHeight, 15);
        ctx.fill();

        // Border
        if (borderColor) {
            if (style === 'neon') {
                ctx.shadowColor = borderColor;
                ctx.shadowBlur = 20;
            }
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 3;
            this.roundRect(ctx, 50, y, width - 100, cardHeight, 15);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Rank badge
        await this.drawRankBadge(ctx, position, y, cardHeight, style);

        // Avatar
        await this.drawAvatar(ctx, user, position, y, cardHeight, style);

        // User info
        this.drawUserInfo(ctx, user, position, y, cardHeight, style);

        // Stats
        this.drawUserStats(ctx, user, y, width, cardHeight, sortConfig, style);
    },

    async drawRankBadge(ctx, position, y, cardHeight, style) {
        const rankSize = 50;
        const rankX = 65;
        const rankY = y + cardHeight / 2;

        let badgeColor;
        if (position === 0) badgeColor = '#FFD700';
        else if (position === 1) badgeColor = '#C0C0C0';
        else if (position === 2) badgeColor = '#CD7F32';
        else badgeColor = style === 'crystal' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)';

        if (style === 'neon' && position < 3) {
            ctx.shadowColor = badgeColor;
            ctx.shadowBlur = 15;
        }

        ctx.fillStyle = badgeColor;
        ctx.beginPath();
        ctx.arc(rankX + rankSize / 2, rankY, rankSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = position < 3 ? '#000000' : (style === 'crystal' ? '#000000' : '#FFFFFF');
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`#${position + 1}`, rankX + rankSize / 2, rankY);
    },

    async drawAvatar(ctx, user, position, y, cardHeight, style) {
        const avatarSize = 50;
        const avatarX = 140;
        const avatarY = y + cardHeight / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        if (user.avatar) {
            try {
                const avatar = await loadImage(user.avatar);
                ctx.drawImage(avatar, avatarX, avatarY - avatarSize / 2, avatarSize, avatarSize);
            } catch (error) {
                this.drawDefaultAvatar(ctx, avatarX, avatarY, avatarSize, position);
            }
        } else {
            this.drawDefaultAvatar(ctx, avatarX, avatarY, avatarSize, position);
        }
        ctx.restore();

        // Border avatar
        if (position < 3) {
            const borderColor = position === 0 ? '#FFD700' : position === 1 ? '#C0C0C0' : '#CD7F32';
            if (style === 'neon') {
                ctx.shadowColor = borderColor;
                ctx.shadowBlur = 10;
            }
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize / 2, avatarY, avatarSize / 2 + 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    },

    drawDefaultAvatar(ctx, avatarX, avatarY, avatarSize, position) {
        const colors = ['#5865F2', '#57F287', '#FEE75C', '#EB459E', '#ED4245'];
        ctx.fillStyle = colors[position % colors.length];
        ctx.fillRect(avatarX, avatarY - avatarSize / 2, avatarSize, avatarSize);
    },

    drawUserInfo(ctx, user, position, y, cardHeight, style) {
        const infoX = 215;
        const infoY = y + cardHeight / 2;

        ctx.fillStyle = style === 'crystal' ? '#000000' : '#FFFFFF';
        ctx.font = 'bold 22px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const username = user.username.length > 20 ? user.username.substring(0, 20) + '...' : user.username;
        ctx.fillText(username, infoX, infoY - 8);

        ctx.fillStyle = style === 'crystal' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.7)';
        ctx.font = '16px Arial, sans-serif';
        ctx.fillText(`Level ${user.level}`, infoX, infoY + 12);
    },

    drawUserStats(ctx, user, y, width, cardHeight, sortConfig, style) {
        const statY = y + cardHeight / 2;
        const statValue = user[sortConfig.field].toLocaleString();

        if (style === 'neon') {
            ctx.shadowColor = sortConfig.color;
            ctx.shadowBlur = 15;
        }

        ctx.fillStyle = sortConfig.color;
        ctx.font = 'bold 26px Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(statValue, width - 80, statY - 8);
        ctx.shadowBlur = 0;

        ctx.fillStyle = style === 'crystal' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.6)';
        ctx.font = '14px Arial, sans-serif';
        ctx.fillText(sortConfig.name, width - 80, statY + 12);
    },

    drawFooter(ctx, width, height, userCount, style) {
        const cardHeight = 70;
        const cardMargin = 5;
        const footerY = 150 + (userCount * (cardHeight + cardMargin)) + 30;

        ctx.fillStyle = style === 'crystal' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)';
        ctx.font = '16px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`📊 Aggiornato il ${new Date().toLocaleDateString('it-IT')} • ${new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`, width / 2, footerY);
    },

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
};