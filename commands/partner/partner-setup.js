// commands/partner/partnership.js
const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    EmbedBuilder
} = require('discord.js');
const ServerConfig = require('../../models/ServerConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('partnership')
        .setDescription('Invia una richiesta di partnership')
        .addUserOption(option =>
            option
                .setName('manager')
                .setDescription('Il manager con cui stai effettuando la partnership')
                .setRequired(false)
        ),

    async execute(interaction) {
        const manager = interaction.options.getUser('manager');

        const modal = new ModalBuilder()
            .setCustomId(`partnershipModal-${manager ? manager.id : 'none'}`)
            .setTitle('📋 Nuova Partnership');

        const descrizioneInput = new TextInputBuilder()
            .setCustomId('descrizione')
            .setLabel('Descrizione della partnership')
            .setPlaceholder('Scrivi qui il testo della tua partnership...')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(2000)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(descrizioneInput)
        );

        await interaction.showModal(modal);
    },

    async handleModalSubmit(interaction) {
        const descrizione = interaction.fields.getTextInputValue('descrizione');

        const managerId   = interaction.customId.split('-')[1];
        const managerUser = managerId !== 'none'
            ? await interaction.client.users.fetch(managerId).catch(() => null)
            : null;

        // Recupera config server da MongoDB
        let config = await ServerConfig.findOne({ guildId: interaction.guild.id });
        if (!config) {
            config = new ServerConfig({ guildId: interaction.guild.id });
        }

        // Salva il partner
        config.partners.push({
            description: descrizione,
            manager:     managerUser ? managerUser.tag : null,
            author:      interaction.user.tag,
        });
        await config.save();

        const partnerRole    = config.pingRole;
        const partnerChannel = config.partnerChannel;

        const embed = new EmbedBuilder()
            .setTitle('🤝 Nuova Partnership')
            .setDescription(descrizione)
            .setColor(0xFF66CC)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .addFields(
                { name: '👤 Inviato da', value: `${interaction.user}`,                                   inline: true },
                { name: '🏠 Server',     value: `\`${interaction.guild.name}\``,                         inline: true },
                { name: '📋 Manager',    value: managerUser ? `${managerUser}` : '`Nessuno assegnato`', inline: true },
                { name: '🔔 Ping',       value: partnerRole ? `<@&${partnerRole}>` : '`Non impostato`', inline: true }
            )
            .setFooter({ text: `Partnership • ${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setTimestamp();

        const targetChannel = partnerChannel
            ? interaction.guild.channels.cache.get(partnerChannel)
            : interaction.channel;

        if (!targetChannel) {
            return interaction.reply({
                content: '❌ Canale partnership non trovato. Usa `/partner-setup set` per configurarlo.',
                ephemeral: true
            });
        }

        await targetChannel.send({
            content: partnerRole ? `<@&${partnerRole}>` : '',
            embeds: [embed]
        });

        await interaction.reply({
            content: `✅ Partnership inviata con successo in ${targetChannel}!`,
            ephemeral: true
        });
    }
};