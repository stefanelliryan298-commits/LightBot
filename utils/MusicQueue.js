const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus,
    VoiceConnectionStatus,
    entersState,
    StreamType
} = require('@discordjs/voice');
const YTDlpWrap = require('yt-dlp-wrap').default;
const ytdlp = new YTDlpWrap();
const { EmbedBuilder } = require('discord.js');
const { spawn } = require('child_process');

class MusicQueue {
    constructor(guildId, voiceChannel, textChannel, config) {
        this.guildId = guildId;
        this.voiceChannel = voiceChannel;
        this.textChannel = textChannel;
        this.config = config;
        
        this.songs = [];
        this.connection = null;
        this.player = null;
        this.playing = false;
        this.volume = config?.defaultVolume || 50;
        this.loop = false;
        this.loopQueue = false;
        
        this.disconnectTimer = null;
        this.disconnectTimeout = config?.disconnectTimeout || 300000;
    }

    async connect(guild) {
        try {
            this.connection = joinVoiceChannel({
                channelId: this.voiceChannel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
                selfDeaf: true
            });

            this.player = createAudioPlayer();
            this.setupPlayerEvents();
            this.setupConnectionEvents();
            this.connection.subscribe(this.player);

            await entersState(this.connection, VoiceConnectionStatus.Ready, 30000);
            console.log(`✅ Connesso a ${this.voiceChannel.name}`);
            return true;
        } catch (error) {
            console.error('❌ Errore connessione:', error);
            return false;
        }
    }

    setupPlayerEvents() {
        this.player.on(AudioPlayerStatus.Idle, () => {
            this.handleSongEnd();
        });

        this.player.on('error', error => {
            console.error('❌ Errore player:', error);
            this.handleSongEnd();
        });
    }

    setupConnectionEvents() {
        this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    entersState(this.connection, VoiceConnectionStatus.Signalling, 5000),
                    entersState(this.connection, VoiceConnectionStatus.Connecting, 5000),
                ]);
            } catch (error) {
                this.destroy();
            }
        });
    }

    async playSong() {
        this.clearDisconnectTimer();

        if (this.songs.length === 0) {
            this.playing = false;
            this.startDisconnectTimer();
            return;
        }

        const song = this.songs[0];
        this.playing = true;

        console.log(`\n🎵 Riproduzione: ${song.title}`);

        try {
            // Usa yt-dlp con pipe diretto a ffmpeg
            const stream = await this.getStreamFromYtdlp(song.url);

            const resource = createAudioResource(stream, {
                inputType: StreamType.Arbitrary,
                inlineVolume: true
            });

            if (resource.volume) {
                resource.volume.setVolume(this.volume / 100);
            }

            this.player.play(resource);

            this.textChannel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('🎵 Ora in Riproduzione')
                        .setDescription(`**[${song.title}](${song.url})**`)
                        .addFields(
                            { name: '⏱️ Durata', value: song.duration, inline: true },
                            { name: '🎤 Artista', value: song.artist || 'Sconosciuto', inline: true },
                            { name: '🎧 Richiesto da', value: song.requestedBy.toString(), inline: true }
                        )
                        .setThumbnail(song.thumbnail)
                ]
            }).catch(() => {});

        } catch (error) {
            console.error('❌ Errore riproduzione:', error);
            this.textChannel.send({ 
                embeds: [new EmbedBuilder().setColor(0xFF0000).setDescription(`❌ Errore: **${song.title}**`)] 
            }).catch(() => {});
            this.handleSongEnd();
        }
    }

    /**
     * Ottiene lo stream da yt-dlp con ffmpeg per conversione corretta
     */
    async getStreamFromYtdlp(url) {
        return new Promise((resolve, reject) => {
            try {
                // Spawn yt-dlp process
                const ytdlpProcess = spawn('yt-dlp', [
                    url,
                    '-f', 'bestaudio',
                    '--quiet',
                    '--no-warnings',
                    '-o', '-'
                ], {
                    stdio: ['ignore', 'pipe', 'pipe'],
                    windowsHide: true
                });

                // Pipe yt-dlp output a ffmpeg
                // Usa wav come formato intermedio (più stabile)
                const ffmpegProcess = spawn('ffmpeg', [
                    '-i', 'pipe:0',
                    '-f', 'wav',
                    '-acodec', 'pcm_s16le',
                    '-ar', '48000',
                    '-ac', '2',
                    'pipe:1'
                ], {
                    stdio: ['pipe', 'pipe', 'pipe'],
                    windowsHide: true
                });

                // Connetti i processi
                ytdlpProcess.stdout.pipe(ffmpegProcess.stdin);

                // Gestisci errori yt-dlp
                ytdlpProcess.stderr.on('data', (data) => {
                    // Ignora stderr di yt-dlp
                });

                ytdlpProcess.on('error', (error) => {
                    console.error('❌ Errore yt-dlp:', error);
                    ffmpegProcess.kill();
                    reject(error);
                });

                // Gestisci errori ffmpeg
                ffmpegProcess.stderr.on('data', (data) => {
                    // Ignora i messaggi di ffmpeg
                    const message = data.toString().toLowerCase();
                    if (message.includes('error')) {
                        console.error('❌ FFmpeg:', data.toString());
                    }
                });

                ffmpegProcess.on('error', (error) => {
                    console.error('❌ Errore ffmpeg:', error);
                    ytdlpProcess.kill();
                    reject(error);
                });

                ffmpegProcess.on('exit', (code) => {
                    if (code && code !== 0) {
                        console.error(`❌ FFmpeg uscito con codice: ${code}`);
                    }
                });

                resolve(ffmpegProcess.stdout);

            } catch (error) {
                reject(error);
            }
        });
    }

    async handleSongEnd() {
        if (this.loop && this.songs.length > 0) {
            await this.playSong();
            return;
        }

        const finishedSong = this.songs.shift();
        if (this.loopQueue && finishedSong) {
            this.songs.push(finishedSong);
        }

        if (this.songs.length > 0) {
            await this.playSong();
        } else {
            this.playing = false;
            this.textChannel.send({ 
                embeds: [new EmbedBuilder().setColor(0x0099FF).setDescription('✅ Coda terminata!')] 
            }).catch(() => {});
            this.startDisconnectTimer();
        }
    }

    startDisconnectTimer() {
        this.clearDisconnectTimer();
        this.disconnectTimer = setTimeout(() => {
            this.textChannel.send({ 
                embeds: [new EmbedBuilder().setColor(0xFFA500).setDescription('👋 Disconnessione!')] 
            }).catch(() => {});
            this.destroy();
        }, this.disconnectTimeout);
    }

    clearDisconnectTimer() {
        if (this.disconnectTimer) {
            clearTimeout(this.disconnectTimer);
            this.disconnectTimer = null;
        }
    }

    skip() {
        if (this.player && this.playing) {
            this.player.stop();
            return true;
        }
        return false;
    }

    stop() {
        this.songs = [];
        if (this.player) this.player.stop();
        this.playing = false;
    }

    pause() {
        if (this.player && this.playing) {
            this.player.pause();
            return true;
        }
        return false;
    }

    resume() {
        if (this.player) {
            this.player.unpause();
            return true;
        }
        return false;
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(100, volume));
        if (this.player?.state?.resource?.volume) {
            this.player.state.resource.volume.setVolume(this.volume / 100);
            return true;
        }
        return false;
    }

    destroy() {
        this.clearDisconnectTimer();
        if (this.player) this.player.stop();
        if (this.connection) this.connection.destroy();
        
        const client = this.textChannel.client;
        if (client?.queues) {
            client.queues.delete(this.guildId);
        }
    }
}

module.exports = MusicQueue;