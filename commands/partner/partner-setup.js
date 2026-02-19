// commands/partner/partner-setup.js
const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    ChannelType
} = require('discord.js');
const db = require('../../utils/db');

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
                    opt
                        .setName('canale')
                        .setDescription('Canale dove verranno inviate le partnership')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
                .addRoleOption(opt =>
                    opt
                        .setName('ruolo')
                        .setDescription('Ruolo da pingare per ogni nuova partnership')
                        .setRequired(true)
                )
                .addStringOption(opt =>
                    opt
                        .setName('ping_type')
                        .setDescription('Tipo di ping da usare quando si raggiunge la soglia membri')
                        .setRequired(true)
                        .addChoices(
                            { name: '🔕 Nessun ping extra',   value: 'none' },
                            { name: '📢 @here',               value: 'here' },
                            { name: '📣 @everyone',           value: 'everyone' }
                        )
                )
                .addIntegerOption(opt =>
                    opt
                        .setName('soglia_membri')
                        .setDescription('Membri minimi nel server per attivare il ping scelto (es. 500)')
                        .setRequired(false)
                        .setMinValue(1)
                )
                .addRoleOption(opt =>
                    opt
                        .setName('ruolo_manager')
                        .setDescription('Ruolo che può usare /partnership (oltre agli admin)')
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('view')
                .setDescription('Visualizza la configurazione attuale della partnership')
        )
        .addSubcommand(sub =>
            sub
                .setName('reset')
                .setDescription('Reimposta tutta la configurazione partnership di questo server')
        ),

    async execute(interaction) {
        const sub      = interaction.options.getSubcommand();
        const serverId = interaction.guild.id;
        const config   = db.getServer(serverId) || {};

        // ─── SET ────────────────────────────────────────────────────────────────
        if (sub === 'set') {
            const canale       = interaction.options.getChannel('canale');
            const ruolo        = interaction.options.getRole('ruolo');
            const pingType     = interaction.options.getString('ping_type');
            const sogliaMemb   = interaction.options.getInteger('soglia_membri') ?? null;
            const ruoloManager = interaction.options.getRole('ruolo_manager') ?? null;

            // Validazione: se ping è @everyone/@here deve esserci la soglia
            if (pingType !== 'none' && !sogliaMemb) {
                return interaction.reply({
                    content: '❌ Devi specificare una **soglia membri** se vuoi usare `@here` o `@everyone`.',
                    ephemeral: true
                });
            }

            // Salvataggio
            config.partnerChannel  = canale.id;
            config.pingRole        = ruolo.id;
            config.pingType        = pingType;
            config.memberThreshold = sogliaMemb;
            config.managerRole     = ruoloManager ? ruoloManager.id : null;
            db.setServer(serverId, config);

            // Embed di conferma
            const pingLabel = {
                none:     '🔕 Nessun ping extra',
                here:     '📢 @here',
                everyone: '📣 @everyone'
            }[pingType];

            const confirmEmbed = new EmbedBuilder()
                .setTitle('✅ Configurazione Partnership Salvata')
                .setColor(0x57F287)
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setDescription('Le impostazioni sono state aggiornate con successo. Ecco il riepilogo:')
                .addFields(
                    {
                        name: '📺 Canale Partnership',
                        value: `${canale}`,
                        inline: true
                    },
                    {
                        name: '🔔 Ruolo Ping',
                        value: `${ruolo}`,
                        inline: true
                    },
                    {
                        name: '📋 Ruolo Manager',
                        value: ruoloManager ? `${ruoloManager}` : '`Non impostato`',
                        inline: true
                    },
                    {
                        name: '📣 Tipo di Ping Extra',
                        value: `\`${pingLabel}\``,
                        inline: true
                    },
                    {
                        name: '👥 Soglia Membri',
                        value: sogliaMemb
                            ? `\`${sogliaMemb.toLocaleString()} membri\``
                            : '`—`',
                        inline: true
                    },
                    {
                        name: '💡 Come funziona',
                        value: sogliaMemb && pingType !== 'none'
                            ? `Quando il server supera **${sogliaMemb.toLocaleString()} membri**, ogni nuova partnership userà \`${pingLabel}\`.`
                            : 'Il ping extra non è attivo.',
                        inline: false
                    }
                )
                .setFooter({
                    text: `Configurato da ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                })
                .setTimestamp();

            return interaction.reply({ embeds: [confirmEmbed], ephemeral: true });
        }

        // ─── VIEW ───────────────────────────────────────────────────────────────
        if (sub === 'view') {
            const hasConfig = config.partnerChannel || config.pingRole;

            if (!hasConfig) {
                return interaction.reply({
                    content: '❌ Nessuna configurazione trovata. Usa `/partner-setup set` per iniziare.',
                    ephemeral: true
                });
            }

            const channelMention = config.partnerChannel
                ? `<#${config.partnerChannel}>`
                : '`Non impostato`';

            const roleMention = config.pingRole
                ? `<@&${config.pingRole}>`
                : '`Non impostato`';

            const managerMention = config.managerRole
                ? `<@&${config.managerRole}>`
                : '`Non impostato`';

            const pingLabel = {
                none:     '🔕 Nessun ping extra',
                here:     '📢 @here',
                everyone: '📣 @everyone'
            }[config.pingType || 'none'];

            const viewEmbed = new EmbedBuilder()
                .setTitle('⚙️ Configurazione Partnership')
                .setColor(0x5865F2)
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .addFields(
                    { name: '📺 Canale Partnership',  value: channelMention,                                                          inline: true },
                    { name: '🔔 Ruolo Ping',          value: roleMention,                                                            inline: true },
                    { name: '📋 Ruolo Manager',       value: managerMention,                                                         inline: true },
                    { name: '📣 Tipo di Ping Extra',  value: `\`${pingLabel}\``,                                                     inline: true },
                    {
                        name: '👥 Soglia Membri',
                        value: config.memberThreshold
                            ? `\`${config.memberThreshold.toLocaleString()} membri\``
                            : '`—`',
                        inline: true
                    },
                    {
                        name: '🤝 Partner Registrati',
                        value: `\`${config.partners?.length ?? 0}\``,
                        inline: true
                    }
                )
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setTimestamp();

            return interaction.reply({ embeds: [viewEmbed], ephemeral: true });
        }

        // ─── RESET ──────────────────────────────────────────────────────────────
        if (sub === 'reset') {
            delete config.partnerChannel;
            delete config.pingRole;
            delete config.pingType;
            delete config.memberThreshold;
            delete config.managerRole;
            db.setServer(serverId, config);

            const resetEmbed = new EmbedBuilder()
                .setTitle('🗑️ Configurazione Resettata')
                .setDescription('Tutte le impostazioni di partnership sono state rimosse.\nUsa `/partner-setup set` per configurare di nuovo il sistema.')
                .setColor(0xED4245)
                .setFooter({
                    text: `Reset eseguito da ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                })
                .setTimestamp();

            return interaction.reply({ embeds: [resetEmbed], ephemeral: true });
        }
    }
};
