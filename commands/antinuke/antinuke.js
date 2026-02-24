// commands/antinuke/antinuke.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ProtectionConfig = require('../../models/ProtectionConfig');

async function getOrCreate(guildId) {
    let cfg = await ProtectionConfig.findOne({ guildId });
    if (!cfg) cfg = new ProtectionConfig({ guildId });
    return cfg;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('antinuke')
        .setDescription('Gestisci la protezione anti-nuke')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

        .addSubcommand(sub => sub
            .setName('toggle')
            .setDescription('Abilita o disabilita anti-nuke'))

        .addSubcommand(sub => sub
            .setName('status')
            .setDescription('Visualizza lo stato anti-nuke'))

        .addSubcommand(sub => sub
            .setName('limits')
            .setDescription('Visualizza i limiti di protezione configurati'))

        .addSubcommand(sub => sub
            .setName('config')
            .setDescription('Configura impostazioni avanzate anti-nuke')
            .addIntegerOption(opt => opt
                .setName('ban_limit')
                .setDescription('Quanti ban prima di intervenire (default 5)')
                .setMinValue(1).setMaxValue(20).setRequired(false))
            .addIntegerOption(opt => opt
                .setName('kick_limit')
                .setDescription('Quanti kick prima di intervenire (default 5)')
                .setMinValue(1).setMaxValue(20).setRequired(false))
            .addIntegerOption(opt => opt
                .setName('channel_limit')
                .setDescription('Quanti canali eliminati prima di intervenire (default 3)')
                .setMinValue(1).setMaxValue(10).setRequired(false))
            .addIntegerOption(opt => opt
                .setName('role_limit')
                .setDescription('Quanti ruoli eliminati prima di intervenire (default 3)')
                .setMinValue(1).setMaxValue(10).setRequired(false))
            .addIntegerOption(opt => opt
                .setName('time_window')
                .setDescription('Finestra temporale in secondi (default 10)')
                .setMinValue(3).setMaxValue(60).setRequired(false))
            .addStringOption(opt => opt
                .setName('azione')
                .setDescription('Cosa fare con il colpevole')
                .setRequired(false)
                .addChoices(
                    { name: 'Ban',              value: 'ban'   },
                    { name: 'Kick',             value: 'kick'  },
                    { name: 'Rimuovi ruoli',    value: 'strip' },
                )))

        .addSubcommand(sub => sub
            .setName('whitelist')
            .setDescription('Aggiungi o rimuovi un utente dalla whitelist')
            .addStringOption(opt => opt
                .setName('azione')
                .setDescription('add o remove')
                .setRequired(true)
                .addChoices(
                    { name: 'Aggiungi', value: 'add'    },
                    { name: 'Rimuovi',  value: 'remove' },
                    { name: 'Lista',    value: 'list'   },
                ))
            .addUserOption(opt => opt
                .setName('utente')
                .setDescription('Utente da aggiungere/rimuovere')
                .setRequired(false))),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const cfg = await getOrCreate(interaction.guild.id);
        const an  = cfg.antinuke;

        // ── TOGGLE ───────────────────────────────────────────────────────────
        if (sub === 'toggle') {
            an.enabled = !an.enabled;
            await cfg.save();

            const embed = new EmbedBuilder()
                .setTitle(`☢️ Anti-Nuke — ${an.enabled ? 'Attivato' : 'Disattivato'}`)
                .setDescription(an.enabled
                    ? '> ✅ La protezione anti-nuke è ora **attiva**.\n> Il server è al sicuro da attacchi massivi.'
                    : '> ❌ La protezione anti-nuke è stata **disattivata**.')
                .setColor(an.enabled ? 0x00FF88 : 0xFF4444)
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ?? undefined })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ── STATUS ───────────────────────────────────────────────────────────
        if (sub === 'status') {
            const wlText = an.whitelist.length
                ? an.whitelist.map(id => `<@${id}>`).join(', ')
                : '`Nessuno`';

            const embed = new EmbedBuilder()
                .setTitle('📊 Anti-Nuke — Stato')
                .addFields(
                    { name: '🔒 Protezione',  value: an.enabled ? '✅ Attiva' : '❌ Disattiva', inline: true },
                    { name: '⚡ Azione',      value: `\`${an.action}\``,                         inline: true },
                    { name: '⏱️ Finestra',    value: `${an.timeWindow}s`,                         inline: true },
                    { name: '🚫 Ban limit',   value: `${an.banLimit}`,     inline: true },
                    { name: '👢 Kick limit',  value: `${an.kickLimit}`,    inline: true },
                    { name: '📁 Ch. limit',   value: `${an.channelLimit}`, inline: true },
                    { name: '🎭 Role limit',  value: `${an.roleLimit}`,    inline: true },
                    { name: '✅ Whitelist',   value: wlText },
                )
                .setColor(an.enabled ? 0x00FF88 : 0xFF4444)
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ?? undefined })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ── LIMITS ───────────────────────────────────────────────────────────
        if (sub === 'limits') {
            const embed = new EmbedBuilder()
                .setTitle('📋 Anti-Nuke — Limiti di protezione')
                .setDescription('> Soglie oltre le quali il sistema interviene automaticamente:')
                .addFields(
                    { name: '🔨 Ban massivi',           value: `Più di **${an.banLimit}** ban in **${an.timeWindow}s**`,     inline: false },
                    { name: '👢 Kick massivi',           value: `Più di **${an.kickLimit}** kick in **${an.timeWindow}s**`,   inline: false },
                    { name: '📁 Canali eliminati',       value: `Più di **${an.channelLimit}** canali in **${an.timeWindow}s**`, inline: false },
                    { name: '🎭 Ruoli eliminati',        value: `Più di **${an.roleLimit}** ruoli in **${an.timeWindow}s**`,  inline: false },
                    { name: '⚡ Azione conseguente',     value: `\`${an.action}\``,                                           inline: false },
                )
                .setColor(0xFF66CC)
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ?? undefined })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ── CONFIG ───────────────────────────────────────────────────────────
        if (sub === 'config') {
            const banLimit     = interaction.options.getInteger('ban_limit');
            const kickLimit    = interaction.options.getInteger('kick_limit');
            const channelLimit = interaction.options.getInteger('channel_limit');
            const roleLimit    = interaction.options.getInteger('role_limit');
            const timeWindow   = interaction.options.getInteger('time_window');
            const azione       = interaction.options.getString('azione');

            if (banLimit     !== null) an.banLimit     = banLimit;
            if (kickLimit    !== null) an.kickLimit    = kickLimit;
            if (channelLimit !== null) an.channelLimit = channelLimit;
            if (roleLimit    !== null) an.roleLimit    = roleLimit;
            if (timeWindow   !== null) an.timeWindow   = timeWindow;
            if (azione       !== null) an.action       = azione;

            cfg.markModified('antinuke');
            await cfg.save();

            const embed = new EmbedBuilder()
                .setTitle('⚙️ Anti-Nuke — Configurazione aggiornata')
                .addFields(
                    { name: '🔨 Ban limit',    value: `${an.banLimit}`,     inline: true },
                    { name: '👢 Kick limit',   value: `${an.kickLimit}`,    inline: true },
                    { name: '📁 Ch. limit',    value: `${an.channelLimit}`, inline: true },
                    { name: '🎭 Role limit',   value: `${an.roleLimit}`,    inline: true },
                    { name: '⏱️ Finestra',     value: `${an.timeWindow}s`,  inline: true },
                    { name: '⚡ Azione',       value: `\`${an.action}\``,   inline: true },
                )
                .setColor(0xFF66CC)
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ?? undefined })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ── WHITELIST ────────────────────────────────────────────────────────
        if (sub === 'whitelist') {
            const azione  = interaction.options.getString('azione');
            const utente  = interaction.options.getUser('utente');

            if (azione === 'list') {
                const wlText = an.whitelist.length
                    ? an.whitelist.map((id, i) => `**${i + 1}.** <@${id}> (\`${id}\`)`).join('\n')
                    : '> Nessun utente in whitelist.';

                const embed = new EmbedBuilder()
                    .setTitle('✅ Anti-Nuke — Whitelist')
                    .setDescription(wlText)
                    .setColor(0x00FF88)
                    .setFooter({ text: `${an.whitelist.length} utenti in whitelist`, iconURL: interaction.guild.iconURL({ dynamic: true }) ?? undefined })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            if (!utente) {
                return interaction.reply({ content: '❌ Specifica un utente.', ephemeral: true });
            }

            if (azione === 'add') {
                if (an.whitelist.includes(utente.id)) {
                    return interaction.reply({ content: `❌ ${utente} è già in whitelist.`, ephemeral: true });
                }
                an.whitelist.push(utente.id);
                cfg.markModified('antinuke');
                await cfg.save();

                const embed = new EmbedBuilder()
                    .setTitle('✅ Whitelist aggiornata')
                    .setDescription(`> ${utente} è stato aggiunto alla whitelist anti-nuke.`)
                    .setColor(0x00FF88)
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            if (azione === 'remove') {
                if (!an.whitelist.includes(utente.id)) {
                    return interaction.reply({ content: `❌ ${utente} non è in whitelist.`, ephemeral: true });
                }
                an.whitelist = an.whitelist.filter(id => id !== utente.id);
                cfg.markModified('antinuke');
                await cfg.save();

                const embed = new EmbedBuilder()
                    .setTitle('🗑️ Whitelist aggiornata')
                    .setDescription(`> ${utente} è stato rimosso dalla whitelist anti-nuke.`)
                    .setColor(0xFF4444)
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }
    }
};
