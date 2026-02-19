// commands/partner/partner-setup.js
const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    ChannelType
} = require('discord.js');
const ServerConfig = require('../../models/ServerConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('partner-setup')
        .setDescription('Configura il sistema di partnership per questo server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub
                .setName('set')
                .setDescription('Imposta le opzioni di partnership')
                .addChannelOption(opt =>
                    opt.setName('canale').setDescription('Canale dove verranno inviate le partnership')
                        .addChannelTypes(ChannelType.GuildText).setRequired(true)
                )
                .addRoleOption(opt =>
                    opt.setName('ruolo').setDescription('Ruolo da pingare per ogni nuova partnership').setRequired(true)
                )
                .addStringOption(opt =>
                    opt.setName('ping_type').setDescription('Tipo di ping da usare quando si raggiunge la soglia membri')
                        .setRequired(true)
                        .addChoices(
                            { name: '🔕 Nessun ping extra', value: 'none' },
                            { name: '📢 @here',             value: 'here' },
                            { name: '📣 @everyone',         value: 'everyone' }
                        )
                )
                .addIntegerOption(opt =>
                    opt.setName('soglia_membri').setDescription('Membri minimi per attivare il ping scelto')
                        .setRequired(false).setMinValue(1)
                )
                .addRoleOption(opt =>
                    opt.setName('ruolo_manager').setDescription('Ruolo che può usare /partnership').setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName('view').setDescription('Visualizza la configurazione attuale della partnership')
        )
        .addSubcommand(sub =>
            sub.setName('reset').setDescription('Reimposta tutta la configurazione partnership di questo server')
        ),

    async execute(interaction) {
        const sub     = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        // ─── SET ────────────────────────────────────────────────────────────────
        if (sub === 'set') {
            const canale       = interaction.options.getChannel('canale');
            const ruolo        = interaction.options.getRole('ruolo');
            const pingType     = interaction.options.getString('ping_type');
            const sogliaMemb   = interaction.options.getInteger('soglia_membri') ?? null;
            const ruoloManager = interaction.options.getRole('ruolo_manager') ?? null;

            if (pingType !== 'none' && !sogliaMemb) {
                return interaction.reply({
                    content: '❌ Devi specificare una **soglia membri** se vuoi usare `@here` o `@everyone`.',
                    ephemeral: true
                });
            }

            await ServerConfig.findOneAndUpdate(
                { guildId },
                {
                    guildId,
                    partnerChannel:  canale.id,
                    pingRole:        ruolo.id,
                    pingType,
                    memberThreshold: sogliaMemb,
                    managerRole:     ruoloManager ? ruoloManager.id : null,
                },
                { upsert: true, new: true }
            );

            const pingLabel = { none: '🔕 Nessun ping extra', here: '📢 @here', everyone: '📣 @everyone' }[pingType];

            const confirmEmbed = new EmbedBuilder()
                .setTitle('✅ Configurazione Partnership Salvata')
                .setColor(0x57F287)
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setDescription('Le impostazioni sono state aggiornate con successo:')
                .addFields(
                    { name: '📺 Canale Partnership', value: `${canale}`,                                                inline: true },
                    { name: '🔔 Ruolo Ping',         value: `${ruolo}`,                                                inline: true },
                    { name: '📋 Ruolo Manager',      value: ruoloManager ? `${ruoloManager}` : '`Non impostato`',     inline: true },
                    { name: '📣 Tipo di Ping Extra', value: `\`${pingLabel}\``,                                        inline: true },
                    {
                        name: '👥 Soglia Membri',
                        value: sogliaMemb ? `\`${sogliaMemb.toLocaleString()} membri\`` : '`—`',
                        inline: true
                    }
                )
                .setFooter({ text: `Configurato da ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            return interaction.reply({ embeds: [confirmEmbed], ephemeral: true });
        }

        // ─── VIEW ───────────────────────────────────────────────────────────────
        if (sub === 'view') {
            const config = await ServerConfig.findOne({ guildId });

            if (!config?.partnerChannel) {
                return interaction.reply({
                    content: '❌ Nessuna configurazione trovata. Usa `/partner-setup set` per iniziare.',
                    ephemeral: true
                });
            }

            const pingLabel = { none: '🔕 Nessun ping extra', here: '📢 @here', everyone: '📣 @everyone' }[config.pingType || 'none'];

            const viewEmbed = new EmbedBuilder()
                .setTitle('⚙️ Configurazione Partnership')
                .setColor(0x5865F2)
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .addFields(
                    { name: '📺 Canale',          value: config.partnerChannel  ? `<#${config.partnerChannel}>`  : '`Non impostato`', inline: true },
                    { name: '🔔 Ruolo Ping',      value: config.pingRole        ? `<@&${config.pingRole}>`       : '`Non impostato`', inline: true },
                    { name: '📋 Ruolo Manager',   value: config.managerRole     ? `<@&${config.managerRole}>`    : '`Non impostato`', inline: true },
                    { name: '📣 Ping Extra',       value: `\`${pingLabel}\``,                                                         inline: true },
                    { name: '👥 Soglia Membri',   value: config.memberThreshold ? `\`${config.memberThreshold.toLocaleString()}\`` : '`—`', inline: true },
                    { name: '🤝 Partner Totali',  value: `\`${config.partners?.length ?? 0}\``,                                      inline: true }
                )
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setTimestamp();

            return interaction.reply({ embeds: [viewEmbed], ephemeral: true });
        }

        // ─── RESET ──────────────────────────────────────────────────────────────
        if (sub === 'reset') {
            await ServerConfig.findOneAndUpdate(
                { guildId },
                {
                    partnerChannel:  null,
                    pingRole:        null,
                    pingType:        'none',
                    memberThreshold: null,
                    managerRole:     null,
                },
                { upsert: true }
            );

            const resetEmbed = new EmbedBuilder()
                .setTitle('🗑️ Configurazione Resettata')
                .setDescription('Tutte le impostazioni di partnership sono state rimosse.\nUsa `/partner-setup set` per configurare di nuovo il sistema.')
                .setColor(0xED4245)
                .setFooter({ text: `Reset da ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            return interaction.reply({ embeds: [resetEmbed], ephemeral: true });
        }
    }
};