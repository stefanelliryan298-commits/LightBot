// commands/antispam/antispam.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ProtectionConfig = require('../../models/ProtectionConfig');

async function getOrCreate(guildId) {
    let cfg = await ProtectionConfig.findOne({ guildId });
    if (!cfg) cfg = new ProtectionConfig({ guildId });
    return cfg;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('antispam')
        .setDescription('Gestisci la protezione anti-spam')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

        .addSubcommand(sub => sub
            .setName('toggle')
            .setDescription('Abilita o disabilita la protezione anti-spam'))

        .addSubcommand(sub => sub
            .setName('settings')
            .setDescription('Configura il limite di messaggi al minuto')
            .addIntegerOption(opt => opt
                .setName('limite')
                .setDescription('Messaggi al minuto consentiti')
                .setRequired(true)
                .addChoices(
                    { name: '30 msg/min (Restrittivo)', value: 30 },
                    { name: '50 msg/min (Bilanciato)',  value: 50 },
                    { name: '80 msg/min (Permissivo)',  value: 80 },
                )))

        .addSubcommand(sub => sub
            .setName('status')
            .setDescription('Visualizza lo stato del sistema anti-spam')),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const cfg = await getOrCreate(interaction.guild.id);

        if (sub === 'toggle') {
            cfg.antispam.enabled = !cfg.antispam.enabled;
            await cfg.save();

            const stato = cfg.antispam.enabled;
            const embed = new EmbedBuilder()
                .setTitle(`🛡️ Anti-Spam — ${stato ? 'Attivato' : 'Disattivato'}`)
                .setDescription(stato
                    ? `> ✅ La protezione anti-spam è ora **attiva**.\n> Limite attuale: **${cfg.antispam.limit} msg/min**`
                    : '> ❌ La protezione anti-spam è stata **disattivata**.')
                .setColor(stato ? 0x00FF88 : 0xFF4444)
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ?? undefined })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === 'settings') {
            const limite = interaction.options.getInteger('limite');
            cfg.antispam.limit = limite;
            await cfg.save();

            const embed = new EmbedBuilder()
                .setTitle('⚙️ Anti-Spam — Impostazioni aggiornate')
                .setDescription(`> Il limite è stato impostato a **${limite} messaggi/minuto**.`)
                .addFields({ name: 'Stato protezione', value: cfg.antispam.enabled ? '✅ Attiva' : '❌ Disattiva', inline: true })
                .setColor(0xFF66CC)
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ?? undefined })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === 'status') {
            const embed = new EmbedBuilder()
                .setTitle('📊 Anti-Spam — Stato')
                .addFields(
                    { name: '🔒 Protezione', value: cfg.antispam.enabled ? '✅ Attiva'   : '❌ Disattiva', inline: true },
                    { name: '📨 Limite',     value: `**${cfg.antispam.limit}** msg/min`,                   inline: true },
                )
                .setColor(cfg.antispam.enabled ? 0x00FF88 : 0xFF4444)
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ?? undefined })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
