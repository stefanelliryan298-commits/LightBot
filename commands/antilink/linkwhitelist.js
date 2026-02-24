// commands/antilink/linkwhitelist.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ProtectionConfig = require('../../models/ProtectionConfig');

async function getOrCreate(guildId) {
    let cfg = await ProtectionConfig.findOne({ guildId });
    if (!cfg) cfg = new ProtectionConfig({ guildId });
    return cfg;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('linkwhitelist')
        .setDescription('Gestisci i canali esenti dal blocco link')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

        .addSubcommand(sub => sub
            .setName('add')
            .setDescription('Aggiungi un canale alla whitelist')
            .addChannelOption(opt => opt
                .setName('canale')
                .setDescription('Canale da esentare')
                .setRequired(true)))

        .addSubcommand(sub => sub
            .setName('remove')
            .setDescription('Rimuovi un canale dalla whitelist')
            .addChannelOption(opt => opt
                .setName('canale')
                .setDescription('Canale da rimuovere')
                .setRequired(true)))

        .addSubcommand(sub => sub
            .setName('list')
            .setDescription('Mostra i canali in whitelist')),

    async execute(interaction) {
        const sub    = interaction.options.getSubcommand();
        const cfg    = await getOrCreate(interaction.guild.id);
        const al     = cfg.antilink;
        const canale = interaction.options.getChannel('canale');

        if (sub === 'add') {
            if (al.whitelistChannels.includes(canale.id)) {
                return interaction.reply({
                    content: `❌ ${canale} è già in whitelist.`,
                    ephemeral: true
                });
            }

            al.whitelistChannels.push(canale.id);
            cfg.markModified('antilink');
            await cfg.save();

            const embed = new EmbedBuilder()
                .setTitle('✅ Whitelist aggiornata')
                .setDescription(`> ${canale} è stato aggiunto alla whitelist.\n> I link Discord in questo canale **non verranno bloccati**.`)
                .setColor(0x00FF88)
                .setFooter({ text: `${al.whitelistChannels.length} canali in whitelist` })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === 'remove') {
            if (!al.whitelistChannels.includes(canale.id)) {
                return interaction.reply({
                    content: `❌ ${canale} non è in whitelist.`,
                    ephemeral: true
                });
            }

            al.whitelistChannels = al.whitelistChannels.filter(id => id !== canale.id);
            cfg.markModified('antilink');
            await cfg.save();

            const embed = new EmbedBuilder()
                .setTitle('🗑️ Whitelist aggiornata')
                .setDescription(`> ${canale} è stato rimosso dalla whitelist.\n> I link Discord in questo canale verranno **bloccati**.`)
                .setColor(0xFF4444)
                .setFooter({ text: `${al.whitelistChannels.length} canali in whitelist` })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === 'list') {
            const wlText = al.whitelistChannels.length
                ? al.whitelistChannels.map((id, i) => `**${i + 1}.** <#${id}>`).join('\n')
                : '> Nessun canale in whitelist — il blocco è attivo ovunque.';

            const embed = new EmbedBuilder()
                .setTitle('📋 Link Whitelist — Canali esenti')
                .setDescription(wlText)
                .setColor(0xFF66CC)
                .setFooter({
                    text: `${al.whitelistChannels.length} canali esenti • Antilink: ${al.enabled ? 'Attivo' : 'Disattivo'}`,
                    iconURL: interaction.guild.iconURL({ dynamic: true }) ?? undefined
                })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
