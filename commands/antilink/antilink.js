// commands/antilink/antilink.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ProtectionConfig = require('../../models/ProtectionConfig');

async function getOrCreate(guildId) {
    let cfg = await ProtectionConfig.findOne({ guildId });
    if (!cfg) cfg = new ProtectionConfig({ guildId });
    return cfg;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('antilink')
        .setDescription('Abilita/disabilita il blocco dei link a server Discord')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

        .addSubcommand(sub => sub
            .setName('toggle')
            .setDescription('Attiva o disattiva antilink'))

        .addSubcommand(sub => sub
            .setName('status')
            .setDescription('Stato del sistema antilink')),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const cfg = await getOrCreate(interaction.guild.id);
        const al  = cfg.antilink;

        if (sub === 'toggle') {
            al.enabled = !al.enabled;
            cfg.markModified('antilink');
            await cfg.save();

            const wlChannels = al.whitelistChannels.length
                ? al.whitelistChannels.map(id => `<#${id}>`).join(', ')
                : '`Nessuno`';

            const embed = new EmbedBuilder()
                .setTitle(`🔗 Anti-Link — ${al.enabled ? 'Attivato' : 'Disattivato'}`)
                .setDescription(al.enabled
                    ? [
                        '> ✅ Il blocco dei link Discord è ora **attivo** in tutti i canali.',
                        `> 📋 Canali esenti: ${wlChannels}`,
                        '> ',
                        '> ⚠️ Chi invia un invite Discord riceverà un avviso in DM.',
                        '> 🔇 Alla **3ª violazione** verrà mutato per **10 minuti**.',
                      ].join('\n')
                    : '> ❌ Il blocco dei link Discord è stato **disattivato**.')
                .setColor(al.enabled ? 0x00FF88 : 0xFF4444)
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ?? undefined })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === 'status') {
            const wlChannels = al.whitelistChannels.length
                ? al.whitelistChannels.map(id => `<#${id}>`).join(', ')
                : '`Nessuno`';

            const embed = new EmbedBuilder()
                .setTitle('📊 Anti-Link — Stato')
                .addFields(
                    { name: '🔒 Protezione',    value: al.enabled ? '✅ Attiva' : '❌ Disattiva', inline: true },
                    { name: '📋 Canali esenti', value: wlChannels },
                    { name: '⚠️ Violazioni',    value: `${al.violations.length} utenti tracciati`, inline: true },
                )
                .setColor(al.enabled ? 0x00FF88 : 0xFF4444)
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ?? undefined })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
