const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

class CanvasUtils {
    /**
     * Crea una leaderboard professionale con grafica moderna
     */
    static async createLeaderboard(users, guildName, sortConfig = { emoji: '🏆', name: 'XP', color: '#FFD700', field: 'xp' }) {
        const width = 1200;
        const height = 900;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Sfondo con gradiente dinamico
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Pattern stellare di sfondo
        this.drawStarPattern(ctx, width, height);

        // Header con effetto glow
        this.drawHeader(ctx, width, guildName, sortConfig);

        // Cards degli utenti
        await this.drawUserCards(ctx, users, width, sortConfig);

        // Footer
        this.drawFooter(ctx, width, height, users.length);

        return canvas.toBuffer('image/png');
    }

    /**
     * Disegna pattern di stelle sullo sfondo
     */
    static drawStarPattern(ctx, width, height) {
        ctx.globalAlpha = 0.05;
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 3;
            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    /**
     * Disegna header con titolo e grafica
     */
    static drawHeader(ctx, width, guildName, sortConfig) {
        // Background header con glow
        ctx.shadowColor = sortConfig.color;
        ctx.shadowBlur = 30;
        ctx.fillStyle = sortConfig.color;
        ctx.fillRect(0, 0, width, 120);
        ctx.shadowBlur = 0;

        // Overlay gradiente
        const headerGradient = ctx.createLinearGradient(0, 0, 0, 120);
        headerGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
        headerGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
        ctx.fillStyle = headerGradient;
        ctx.fillRect(0, 0, width, 120);

        // Titolo principale
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 48px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillText(`${sortConfig.emoji} ${guildName}`, width / 2, 55);
        
        // Sottotitolo
        ctx.font = 'bold 28px Arial, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillText(`Classifica ${sortConfig.name}`, width / 2, 95);
        ctx.shadowBlur = 0;
    }

    /**
     * Disegna le card degli utenti
     */
    static async drawUserCards(ctx, users, width, sortConfig) {
        const cardStartY = 150;
        const cardHeight = 70;
        const cardMargin = 5;

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const y = cardStartY + (i * (cardHeight + cardMargin));

            await this.drawUserCard(ctx, user, i, y, width, cardHeight, sortConfig);
        }
    }

    /**
     * Disegna una singola card utente
     */
    static async drawUserCard(ctx, user, position, y, width, cardHeight, sortConfig) {
        // Colore card basato su posizione
        let cardColor;
        let borderColor = null;

        if (position === 0) {
            cardColor = 'rgba(255, 215, 0, 0.15)';
            borderColor = '#FFD700';
        } else if (position === 1) {
            cardColor = 'rgba(192, 192, 192, 0.15)';
            borderColor = '#C0C0C0';
        } else if (position === 2) {
            cardColor = 'rgba(205, 127, 50, 0.15)';
            borderColor = '#CD7F32';
        } else {
            cardColor = 'rgba(255, 255, 255, 0.08)';
        }

        // Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 5;

        // Background
        ctx.fillStyle = cardColor;
        this.roundRect(ctx, 50, y, width - 100, cardHeight, 15);
        ctx.fill();

        // Border per top 3
        if (borderColor) {
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 3;
            this.roundRect(ctx, 50, y, width - 100, cardHeight, 15);
            ctx.stroke();
        }

        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Rank badge
        await this.drawRankBadge(ctx, position, y, cardHeight);

        // Avatar
        await this.drawAvatar(ctx, user, position, y, cardHeight);

        // Info utente
        this.drawUserInfo(ctx, user, position, y, cardHeight);

        // Stats
        this.drawUserStats(ctx, user, y, width, cardHeight, sortConfig);
    }

    /**
     * Disegna il badge del rank
     */
    static async drawRankBadge(ctx, position, y, cardHeight) {
        const rankSize = 50;
        const rankX = 65;
        const rankY = y + cardHeight / 2;

        // Colore badge
        let badgeColor;
        if (position === 0) badgeColor = '#FFD700';
        else if (position === 1) badgeColor = '#C0C0C0';
        else if (position === 2) badgeColor = '#CD7F32';
        else badgeColor = 'rgba(255, 255, 255, 0.2)';

        // Cerchio badge
        ctx.fillStyle = badgeColor;
        ctx.beginPath();
        ctx.arc(rankX + rankSize / 2, rankY, rankSize / 2, 0, Math.PI * 2);
        ctx.fill();

        // Numero rank
        ctx.fillStyle = position < 3 ? '#000000' : '#FFFFFF';
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`#${position + 1}`, rankX + rankSize / 2, rankY);
    }

    /**
     * Disegna l'avatar dell'utente
     */
    static async drawAvatar(ctx, user, position, y, cardHeight) {
        const avatarSize = 50;
        const avatarX = 140;
        const avatarY = y + cardHeight / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Prova a caricare avatar
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

        // Border avatar per top 3
        if (position < 3) {
            const borderColor = position === 0 ? '#FFD700' : position === 1 ? '#C0C0C0' : '#CD7F32';
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize / 2, avatarY, avatarSize / 2 + 2, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    /**
     * Disegna avatar di default colorato
     */
    static drawDefaultAvatar(ctx, avatarX, avatarY, avatarSize, position) {
        const colors = ['#5865F2', '#57F287', '#FEE75C', '#EB459E', '#ED4245', '#3BA55C'];
        ctx.fillStyle = colors[position % colors.length];
        ctx.fillRect(avatarX, avatarY - avatarSize / 2, avatarSize, avatarSize);
        
        // Iniziale
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', avatarX + avatarSize / 2, avatarY);
    }

    /**
     * Disegna info utente (username e level)
     */
    static drawUserInfo(ctx, user, position, y, cardHeight) {
        const infoX = 215;
        const infoY = y + cardHeight / 2;

        // Username
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 22px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const username = user.username.length > 20 ? user.username.substring(0, 20) + '...' : user.username;
        ctx.fillText(username, infoX, infoY - 8);

        // Level
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '16px Arial, sans-serif';
        ctx.fillText(`Level ${user.level}`, infoX, infoY + 12);
    }

    /**
     * Disegna statistiche utente
     */
    static drawUserStats(ctx, user, y, width, cardHeight, sortConfig) {
        const statY = y + cardHeight / 2;

        // Valore stat
        const statValue = user[sortConfig.field].toLocaleString();
        ctx.fillStyle = sortConfig.color;
        ctx.font = 'bold 26px Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(statValue, width - 80, statY - 8);

        // Label stat
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '14px Arial, sans-serif';
        ctx.fillText(sortConfig.name, width - 80, statY + 12);
    }

    /**
     * Disegna footer
     */
    static drawFooter(ctx, width, height, userCount) {
        const cardHeight = 70;
        const cardMargin = 5;
        const footerY = 150 + (userCount * (cardHeight + cardMargin)) + 30;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '16px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`📊 Aggiornato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`, width / 2, footerY);
    }

    /**
     * Utility: rettangolo con angoli arrotondati
     */
    static roundRect(ctx, x, y, width, height, radius) {
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

    /**
     * Crea un'immagine del profilo utente con grafica professionale
     * (Mantenuta dalla versione precedente)
     */
    static async createProfile(user, stats, warnings) {
        const canvas = createCanvas(800, 400);
        const ctx = canvas.getContext('2d');

        // Sfondo con gradiente
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 400);

        // Box principale
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(30, 30, 740, 340);

        // Avatar placeholder (cerchio)
        ctx.beginPath();
        ctx.arc(130, 130, 70, 0, Math.PI * 2);
        ctx.fillStyle = '#3282b8';
        ctx.fill();
        ctx.strokeStyle = '#bbe1fa';
        ctx.lineWidth = 5;
        ctx.stroke();

        // Iniziali utente nell'avatar
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(user.username.charAt(0).toUpperCase(), 130, 145);

        // Nome utente
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(user.username, 230, 100);

        // Tag utente
        ctx.fillStyle = '#bbe1fa';
        ctx.font = '20px Arial';
        ctx.fillText(`#${user.discriminator || '0000'}`, 230, 130);

        // Level badge
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(230, 150, 120, 40);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`LEVEL ${stats.level}`, 290, 177);

        // Statistiche
        const statsY = 250;
        const statsData = [
            { label: '📨 Messaggi', value: stats.messages.toLocaleString() },
            { label: '🎤 Minuti Vocali', value: stats.voiceMinutes.toLocaleString() },
            { label: '⭐ XP Totale', value: stats.xp.toLocaleString() },
            { label: '⚠️ Avvertimenti', value: warnings.toLocaleString() }
        ];

        statsData.forEach((stat, index) => {
            const x = 60 + (index * 180);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(x, statsY, 160, 80);
            
            ctx.fillStyle = '#bbe1fa';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(stat.label, x + 80, statsY + 30);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial';
            ctx.fillText(stat.value, x + 80, statsY + 60);
        });

        return canvas.toBuffer();
    }

    /**
     * Crea una progress bar animata
     */
    static drawProgressBar(ctx, x, y, width, height, percentage, color = '#5865F2') {
        // Background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.roundRect(ctx, x, y, width, height, height / 2);
        ctx.fill();

        // Progress
        const progressWidth = (width * percentage) / 100;
        const gradient = ctx.createLinearGradient(x, y, x + progressWidth, y);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, this.lightenColor(color, 20));
        
        ctx.fillStyle = gradient;
        this.roundRect(ctx, x, y, progressWidth, height, height / 2);
        ctx.fill();

        // Glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        this.roundRect(ctx, x, y, progressWidth, height, height / 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    /**
     * Disegna testo con ombra per migliore leggibilità
     */
    static drawTextWithShadow(ctx, text, x, y, color = '#ffffff', shadowColor = '#000000') {
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }

    /**
     * Schiarisce un colore hex
     */
    static lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16).slice(1);
    }
}

module.exports = CanvasUtils;