const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const UserStats = require('../../models/UserStats');
const Warning = require('../../models/Warning');
const CanvasUtils = require('../../utils/canvas');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Visualizza il profilo di un utente con statistiche dettagliate')
        .addUserOption(option =>
            option.setName('utente')
                .setDescription('L\'utente di cui visualizzare il profilo (lascia vuoto per te stesso)')
                .setRequired(false)),
    
    cooldown: 10,

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const targetUser = interaction.options.getUser('utente') || interaction.user;
            const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            if (!member) {
                return interaction.editReply('❌ Utente non trovato nel server!');
            }

            // Recupera le statistiche dell'utente
            let userStats = await UserStats.findOne({
                guildId: interaction.guild.id,
                userId: targetUser.id
            });

            if (!userStats) {
                userStats = {
                    messages: 0,
                    voiceMinutes: 0,
                    level: 1,
                    xp: 0,
                    warnings: 0
                };
            }

            // Conta gli avvertimenti
            const warningCount = await Warning.countDocuments({
                guildId: interaction.guild.id,
                userId: targetUser.id
            });

            // Crea l'immagine del profilo con Canvas
            const profileImage = await CanvasUtils.createProfile(
                {
                    username: targetUser.username,
                    discriminator: targetUser.discriminator,
                    id: targetUser.id
                },
                userStats,
                warningCount
            );

            const attachment = new AttachmentBuilder(profileImage, { 
                name: 'profile.png' 
            });

            await interaction.editReply({ 
                files: [attachment],
                content: `**📊 Profilo di ${targetUser.username}**`
            });

        } catch (error) {
            console.error('Errore comando profile:', error);
            await interaction.editReply('❌ Si è verificato un errore nella creazione del profilo!');
        }
    },
};
