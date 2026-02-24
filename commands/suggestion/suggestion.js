// commands/suggestion/suggestion.js
const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} = require('discord.js');
const ProtectionConfig = require('../../models/ProtectionConfig');

async function getOrCreate(guildId) {
    let cfg = await ProtectionConfig.findOne({ guildId });
    if (!cfg) cfg = new ProtectionConfig({ guildId });
    return cfg;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggestion')
        .setDescription('Sistema suggerimenti')

        // setup: solo admin
        .addSubcommand(sub => sub
            .setName('setup')
            .setDescription('Configura il canale per i suggerimenti (Admin)')
            .addChannelOption(opt => opt
                .setName('canale')
                .setDescription('Canale dove inviare i suggerimenti')
                .setRequired(true)))

        // send: accessibile a tutti
        .addSubcommand(sub => sub
            .setName('send')
            .setDescription('Invia un suggerimento al canale configurato')
            .addStringOption(opt => opt
                .setName('testo')
                .setDescription('Il tuo suggerimento')
                .setMinLength(10)
                .setMaxLength(1000)
                .setRequired(true))),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const cfg = await getOrCreate(interaction.guild.id);

        // ── SETUP (solo admin) ───────────────────────────────────────────────
        if (sub === 'setup') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    content: '❌ Solo gli amministratori possono configurare il canale suggerimenti.',
                    ephemeral: true
                });
            }

            const canale = interaction.options.getChannel('canale');
            cfg.suggestion.channelId = canale.id;
            cfg.markModified('suggestion');
            await cfg.save();

            const embed = new EmbedBuilder()
                .setTitle('✅ Suggerimenti — Canale configurato')
                .setDescription(`> I suggerimenti verranno inviati in ${canale}.\n> Usa \`/suggestion send\` per inviare il primo!`)
                .setColor(0x00FF88)
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ?? undefined })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ── SEND (tutti) ─────────────────────────────────────────────────────
        if (sub === 'send') {
            if (!cfg.suggestion.channelId) {
                return interaction.reply({
                    content: '❌ Nessun canale suggerimenti configurato. Chiedi a un admin di usare `/suggestion setup`.',
                    ephemeral: true
                });
            }

            const targetChannel = interaction.guild.channels.cache.get(cfg.suggestion.channelId);
            if (!targetChannel) {
                return interaction.reply({
                    content: '❌ Il canale suggerimenti non esiste più. Chiedi a un admin di riconfigurarlo.',
                    ephemeral: true
                });
            }

            const testo = interaction.options.getString('testo');

            const embed = new EmbedBuilder()
                .setTitle('💡 Nuovo Suggerimento')
                .setDescription(`> ${testo}`)
                .addFields(
                    { name: '👤 Proposto da', value: `${interaction.user} (\`${interaction.user.tag}\`)`, inline: true },
                )
                .setColor(0xFFCC00)
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ?? undefined })
                .setTimestamp();

            // Bottoni voto ✅ ❌
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('suggestion_upvote')
                    .setLabel('👍 Approva')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('suggestion_downvote')
                    .setLabel('👎 Rifiuta')
                    .setStyle(ButtonStyle.Danger),
            );

            const msg = await targetChannel.send({ embeds: [embed], components: [row] });

            // Aggiungi anche le reaction come alternativa
            await msg.react('✅').catch(() => {});
            await msg.react('❌').catch(() => {});

            return interaction.reply({
                content: `✅ Il tuo suggerimento è stato inviato in ${targetChannel}!`,
                ephemeral: true
            });
        }
    }
};
