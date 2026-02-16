const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Guild = require('../../models/Guild');
const { translations } = require('../../utils/translations');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlang')
        .setDescription('Imposta la lingua del server')
        .addStringOption(option =>
            option.setName('lingua')
                .setDescription('Seleziona la lingua del server')
                .setRequired(true)
                .addChoices(
                    { name: '🇸🇦 Arabic - العربية', value: 'ar' },
                    { name: '🇧🇬 Bulgarian - Български', value: 'bg' },
                    { name: '🇮🇶 Kurdish - کوردی', value: 'ku' },
                    { name: '🇨🇿 Czech - Čeština', value: 'cs' },
                    { name: '🇩🇰 Danish - Dansk', value: 'da' },
                    { name: '🇩🇪 German - Deutsch', value: 'de' },
                    { name: '🇬🇷 Greek - Ελληνικά', value: 'el' },
                    { name: '🇬🇧 English', value: 'en' },
                    { name: '🇪🇸 Spanish - Español', value: 'es' },
                    { name: '🇮🇷 Persian - فارسی', value: 'fa' },
                    { name: '🇫🇮 Finnish - Suomi', value: 'fi' },
                    { name: '🇫🇷 French - Français', value: 'fr' },
                    { name: '🇮🇱 Hebrew - עברית', value: 'he' },
                    { name: '🇮🇳 Hindi - हिन्दी', value: 'hi' },
                    { name: '🇭🇷 Croatian - Hrvatski', value: 'hr' },
                    { name: '🇭🇺 Hungarian - Magyar', value: 'hu' },
                    { name: '🇮🇹 Italian - Italiano', value: 'it' },
                    { name: '🇯🇵 Japanese - 日本語', value: 'ja' },
                    { name: '🇰🇷 Korean - 한국어', value: 'ko' },
                    { name: '🇱🇹 Lithuanian - Lietuvių', value: 'lt' },
                    { name: '🇳🇱 Dutch - Nederlands', value: 'nl' },
                    { name: '🇳🇴 Norwegian - Norsk', value: 'no' },
                    { name: '🇵🇱 Polish - Polski', value: 'pl' },
                    { name: '🇵🇹 Portuguese - Português', value: 'pt' },
                    { name: '🇧🇷 Portuguese (Brazilian)', value: 'pt-BR' }
                ))
        .addStringOption(option =>
            option.setName('lingua2')
                .setDescription('Altre lingue disponibili')
                .setRequired(false)
                .addChoices(
                    { name: '🇷🇴 Romanian - Română', value: 'ro' },
                    { name: '🇷🇺 Russian - Русский', value: 'ru' },
                    { name: '🇸🇰 Slovak - Slovenčina', value: 'sk' },
                    { name: '🇷🇸 Serbian - Српски', value: 'sr' },
                    { name: '🇸🇪 Swedish - Svenska', value: 'sv' },
                    { name: '🇹🇭 Thai - ไทย', value: 'th' },
                    { name: '🇵🇭 Tagalog', value: 'tl' },
                    { name: '🇹🇷 Turkish - Türkçe', value: 'tr' },
                    { name: '🇺🇦 Ukrainian - Українська', value: 'uk' },
                    { name: '🇻🇳 Vietnamese - Tiếng Việt', value: 'vi' },
                    { name: '🇨🇳 Chinese Simplified - 简体中文', value: 'zh-CN' },
                    { name: '🇹🇼 Chinese Traditional - 繁體中文', value: 'zh-TW' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    permissions: PermissionFlagsBits.Administrator,
    cooldown: 10,

    async execute(interaction) {
        await interaction.deferReply();

        const language = interaction.options.getString('lingua') || interaction.options.getString('lingua2');

        if (!translations[language]) {
            return interaction.editReply('❌ Lingua non supportata! Scegli tra le opzioni disponibili.');
        }

        try {
            // Aggiorna o crea la configurazione del server
            let guildConfig = await Guild.findOne({ guildId: interaction.guild.id });

            if (!guildConfig) {
                guildConfig = new Guild({ guildId: interaction.guild.id });
            }

            const oldLanguage = guildConfig.language;
            guildConfig.language = language;
            await guildConfig.save();

            const languageInfo = translations[language];

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🌍 Lingua del Server Aggiornata')
                .setDescription(`La lingua del server è stata impostata su **${languageInfo.name}**!`)
                .addFields(
                    {
                        name: '📝 Dettagli',
                        value: `**Lingua Precedente:** ${translations[oldLanguage]?.name || 'English'}\n` +
                               `**Nuova Lingua:** ${languageInfo.name}\n` +
                               `**Codice:** \`${language}\``,
                        inline: false
                    },
                    {
                        name: 'ℹ️ Informazioni',
                        value: 'I comandi del bot verranno visualizzati nella lingua selezionata. ' +
                               'Questa impostazione influisce sui messaggi di sistema e sulle risposte del bot.',
                        inline: false
                    }
                )
                .setFooter({ 
                    text: `Modificato da ${interaction.user.tag}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Errore comando setlang:', error);
            await interaction.editReply('❌ Si è verificato un errore nell\'impostazione della lingua!');
        }
    },
};
