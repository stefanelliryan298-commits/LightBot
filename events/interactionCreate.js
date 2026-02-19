const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // ═══════════════════════════════════════════════════════
        //  🔍 GESTIONE AUTOCOMPLETAMENTO
        // ═══════════════════════════════════════════════════════
        if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);
            
            if (!command || !command.autocomplete) return;

            try {
                await command.autocomplete(interaction, client);
            } catch (error) {
                console.error(`❌ Errore autocompletamento [${interaction.commandName}]:`, error);
            }
            return;
        }

        // ═══════════════════════════════════════════════════════
        //  🎮 GESTIONE COMANDI SLASH
        // ═══════════════════════════════════════════════════════
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`⚠️  Comando ${interaction.commandName} non trovato.`);
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0xFF0000)
                            .setDescription('❌ Comando non trovato!')
                    ],
                    ephemeral: true
                });
            }

            // ───────────────────────────────────────────────────
            //  🔒 VERIFICA PERMESSI
            // ───────────────────────────────────────────────────
            if (command.permissions) {
                const hasPermission = interaction.member.permissions.has(command.permissions);
                
                if (!hasPermission) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xFF0000)
                                .setTitle('🔒 Permessi Insufficienti')
                                .setDescription('Non hai i permessi necessari per usare questo comando!')
                                .addFields({
                                    name: '📋 Permessi Richiesti',
                                    value: `\`${command.permissions.join('`, `')}\``
                                })
                        ],
                        ephemeral: true
                    });
                }
            }

            // ───────────────────────────────────────────────────
            //  ⏱️ GESTIONE COOLDOWN
            // ───────────────────────────────────────────────────
            if (!client.cooldowns) {
                client.cooldowns = new Map();
            }

            const { cooldowns } = client;

            if (!cooldowns.has(command.data.name)) {
                cooldowns.set(command.data.name, new Map());
            }

            const now = Date.now();
            const timestamps = cooldowns.get(command.data.name);
            const cooldownAmount = (command.cooldown || 3) * 1000;

            if (timestamps.has(interaction.user.id)) {
                const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

                if (now < expirationTime) {
                    const timeLeft = (expirationTime - now) / 1000;
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xFFAA00)
                                .setTitle('⏱️ Cooldown Attivo')
                                .setDescription(`Aspetta **${timeLeft.toFixed(1)}s** prima di usare di nuovo \`/${command.data.name}\``)
                        ],
                        ephemeral: true
                    });
                }
            }

            timestamps.set(interaction.user.id, now);
            setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

            // ───────────────────────────────────────────────────
            //  🚀 ESECUZIONE COMANDO
            // ───────────────────────────────────────────────────
            try {
                console.log(`🎵 [${interaction.guild.name}] ${interaction.user.tag} usa /${command.data.name}`);
                await command.execute(interaction, client);
            } catch (error) {
                console.error(`❌ Errore durante l'esecuzione di ${interaction.commandName}:`, error);
                
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Errore')
                    .setDescription('Si è verificato un errore durante l\'esecuzione del comando!')
                    .setFooter({ text: 'Se il problema persiste, contatta un amministratore' })
                    .setTimestamp();

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                }
            }
        }

        // ═══════════════════════════════════════════════════════
        //  📋 GESTIONE MODAL SUBMIT
        // ═══════════════════════════════════════════════════════
        if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('partnershipModal-')) {
                const command = client.commands.get('partnership');

                if (!command?.handleModalSubmit) return;

                try {
                    await command.handleModalSubmit(interaction);
                } catch (error) {
                    console.error('❌ Errore modal partnership:', error);

                    const errorEmbed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle('❌ Errore')
                        .setDescription('Si è verificato un errore durante l\'invio della partnership!')
                        .setTimestamp();

                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                    } else {
                        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                    }
                }
            }
            return;
        }

        // ═══════════════════════════════════════════════════════
        //  🔘 GESTIONE CONTEXT MENU (opzionale)
        // ═══════════════════════════════════════════════════════
        if (interaction.isContextMenuCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) return;

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(`❌ Errore context menu [${interaction.commandName}]:`, error);
                
                await interaction.reply({
                    content: '❌ Errore durante l\'esecuzione!',
                    ephemeral: true
                });
            }
        }
    }
};
