const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const UserStats = require('../../models/UserStats');
const Warning = require('../../models/Warning');
const Ban = require('../../models/Ban');
const Mute = require('../../models/Mute');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Visualizza le statistiche dettagliate del server'),
    
    cooldown: 30,

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const guild = interaction.guild;

            // Statistiche membri
            const totalMembers = guild.memberCount;
            const bots = guild.members.cache.filter(m => m.user.bot).size;
            const humans = totalMembers - bots;
            const onlineMembers = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;

            // Statistiche canali
            const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
            const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
            const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;
            const totalChannels = textChannels + voiceChannels;

            // Statistiche ruoli
            const totalRoles = guild.roles.cache.size - 1; // -1 per escludere @everyone

            // Statistiche moderazione
            const totalWarnings = await Warning.countDocuments({ guildId: guild.id });
            const activeBans = await Ban.countDocuments({ guildId: guild.id, active: true });
            const activeMutes = await Mute.countDocuments({ guildId: guild.id, active: true });

            // Statistiche messaggi e attività
            const totalMessages = await UserStats.aggregate([
                { $match: { guildId: guild.id } },
                { $group: { _id: null, total: { $sum: '$messages' } } }
            ]);
            const messageCount = totalMessages[0]?.total || 0;

            const totalVoiceMinutes = await UserStats.aggregate([
                { $match: { guildId: guild.id } },
                { $group: { _id: null, total: { $sum: '$voiceMinutes' } } }
            ]);
            const voiceMinutes = totalVoiceMinutes[0]?.total || 0;

            // Utente più attivo
            const topUser = await UserStats.findOne({ guildId: guild.id })
                .sort({ xp: -1 })
                .limit(1);

            // Crea l'embed con tutte le statistiche
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`📊 Statistiche di ${guild.name}`)
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .addFields(
                    {
                        name: '👥 Membri',
                        value: `**Totale:** ${totalMembers.toLocaleString()}\n` +
                               `**Umani:** ${humans.toLocaleString()}\n` +
                               `**Bot:** ${bots.toLocaleString()}\n` +
                               `**Online:** ${onlineMembers.toLocaleString()}`,
                        inline: true
                    },
                    {
                        name: '📺 Canali',
                        value: `**Totale:** ${totalChannels}\n` +
                               `**Testuali:** ${textChannels}\n` +
                               `**Vocali:** ${voiceChannels}\n` +
                               `**Categorie:** ${categories}`,
                        inline: true
                    },
                    {
                        name: '🎭 Ruoli',
                        value: `**Totale:** ${totalRoles}`,
                        inline: true
                    },
                    {
                        name: '🛡️ Moderazione',
                        value: `**Avvertimenti:** ${totalWarnings.toLocaleString()}\n` +
                               `**Ban Attivi:** ${activeBans.toLocaleString()}\n` +
                               `**Mute Attivi:** ${activeMutes.toLocaleString()}`,
                        inline: true
                    },
                    {
                        name: '💬 Attività',
                        value: `**Messaggi:** ${messageCount.toLocaleString()}\n` +
                               `**Minuti Vocali:** ${voiceMinutes.toLocaleString()}\n` +
                               `**Media/Utente:** ${Math.floor(messageCount / humans).toLocaleString()}`,
                        inline: true
                    },
                    {
                        name: '🏆 Top Utente',
                        value: topUser ? `${topUser.username}\n**Level ${topUser.level}** • ${topUser.xp.toLocaleString()} XP` : 'Nessun dato',
                        inline: true
                    },
                    {
                        name: '📅 Informazioni Server',
                        value: `**Creato:** <t:${Math.floor(guild.createdTimestamp / 1000)}:R>\n` +
                               `**Owner:** <@${guild.ownerId}>\n` +
                               `**Boost Level:** ${guild.premiumTier}\n` +
                               `**Boosts:** ${guild.premiumSubscriptionCount || 0}`,
                        inline: false
                    }
                )
                .setFooter({ 
                    text: `ID Server: ${guild.id}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })
                .setTimestamp();

            // Se il server ha un banner, aggiungilo
            if (guild.banner) {
                embed.setImage(guild.bannerURL({ size: 1024 }));
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Errore comando stats:', error);
            await interaction.editReply('❌ Si è verificato un errore nel recupero delle statistiche!');
        }
    },
};
