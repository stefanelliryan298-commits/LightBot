// commands/antiraid/antiraid.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ProtectionConfig = require('../../models/ProtectionConfig');

async function getOrCreate(guildId) {
    let cfg = await ProtectionConfig.findOne({ guildId });
    if (!cfg) cfg = new ProtectionConfig({ guildId });
    return cfg;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('antiraid')
        .setDescription('Gestisci la protezione anti-raid')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

        .addSubcommand(sub => sub
            .setName('toggle')
            .setDescription('Abilita o disabilita anti-raid'))

        .addSubcommand(sub => sub
            .setName('status')
            .setDescription('Visualizza lo stato anti-raid'))

        .addSubcommand(sub => sub
            .setName('config')
            .setDescription('Configura impostazioni anti-raid')
            .addIntegerOption(opt => opt
                .setName('join_threshold')
                .setDescription('Quanti join in rapida sequenza prima di attivare la protezione')
                .setMinValue(3).setMaxValue(50).setRequired(false))
            .addIntegerOption(opt => opt
                .setName('time_window')
                .setDescription('Finestra temporale in secondi')
                .setMinValue(3).setMaxValue(60).setRequired(false))
            .addStringOption(opt => opt
                .setName('azione')
                .setDescription('Cosa fare con i raider')
                .setRequired(false)
                .addChoices(
                    { name: 'Kick',    value: 'kick'    },
                    { name: 'Ban',     value: 'ban'     },
                    { name: 'Timeout', value: 'timeout' },
                )))

        .addSubcommand(sub => sub
            .setName('reset')
            .setDescription('Resetta il sistema anti-raid (svuota contatori)')),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const cfg = await getOrCreate(interaction.guild.id);
        const ar  = cfg.antiraid;

        // ── TOGGLE ───────────────────────────────────────────────────────────
        if (sub === 'toggle') {
            ar.enabled = !ar.enabled;
            cfg.markModified('antiraid');
            await cfg.save();

            const embed = new EmbedBuilder()
                .setTitle(`🚨 Anti-Raid — ${ar.enabled ? 'Attivato' : 'Disattivato'}`)
                .setDescription(ar.enabled
                    ? `> ✅ La protezione anti-raid è ora **attiva**.\n> Soglia: **${ar.joinThreshold}** join in **${ar.timeWindow}s**`
                    : '> ❌ La protezione anti-raid è stata **disattivata**.')
                .setColor(ar.enabled ? 0x00FF88 : 0xFF4444)
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ?? undefined })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ── STATUS ───────────────────────────────────────────────────────────
        if (sub === 'status') {
            const embed = new EmbedBuilder()
                .setTitle('📊 Anti-Raid — Stato')
                .addFields(
                    { name: '🔒 Protezione',    value: ar.enabled ? '✅ Attiva' : '❌ Disattiva', inline: true },
                    { name: '⚡ Azione',        value: `\`${ar.action}\``,                         inline: true },
                    { name: '👥 Join threshold', value: `${ar.joinThreshold} join`,                inline: true },
                    { name: '⏱️ Finestra',       value: `${ar.timeWindow}s`,                       inline: true },
                    { name: '🔐 Lockdown',       value: ar.lockdown ? '✅ Attivo' : '❌ No',        inline: true },
                )
                .setColor(ar.enabled ? 0x00FF88 : 0xFF4444)
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ?? undefined })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ── CONFIG ───────────────────────────────────────────────────────────
        if (sub === 'config') {
            const joinThreshold = interaction.options.getInteger('join_threshold');
            const timeWindow    = interaction.options.getInteger('time_window');
            const azione        = interaction.options.getString('azione');

            if (joinThreshold !== null) ar.joinThreshold = joinThreshold;
            if (timeWindow    !== null) ar.timeWindow    = timeWindow;
            if (azione        !== null) ar.action        = azione;

            cfg.markModified('antiraid');
            await cfg.save();

            const embed = new EmbedBuilder()
                .setTitle('⚙️ Anti-Raid — Configurazione aggiornata')
                .addFields(
                    { name: '👥 Join threshold', value: `${ar.joinThreshold} join`, inline: true },
                    { name: '⏱️ Finestra',       value: `${ar.timeWindow}s`,        inline: true },
                    { name: '⚡ Azione',         value: `\`${ar.action}\``,          inline: true },
                )
                .setColor(0xFF66CC)
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ?? undefined })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // ── RESET ────────────────────────────────────────────────────────────
        if (sub === 'reset') {
            // Il contatore dei join è in memoria (Map nel event handler), quindi basta notificare
            // Se vuoi persistere i contatori su Mongo puoi aggiungere un campo joinLog
            const embed = new EmbedBuilder()
                .setTitle('🔄 Anti-Raid — Reset completato')
                .setDescription('> ✅ I contatori del sistema anti-raid sono stati resettati.\n> Il monitoraggio riprende da zero.')
                .setColor(0x00FF88)
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) ?? undefined })
                .setTimestamp();

            // Emetti un evento custom per svuotare la Map in memoria nel event handler
            interaction.client.emit('antiraidReset', interaction.guild.id);

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
