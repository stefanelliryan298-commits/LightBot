// commands/partner/partnership.js
const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    EmbedBuilder
} = require('discord.js');
const db = require('../../utils/db');

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

        const titoloInput = new TextInputBuilder()
            .setCustomId('titolo')
            .setLabel('Titolo del server / progetto')
            .setPlaceholder('Es. Server Gaming XYZ')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(100)
            .setRequired(true);

        const descrizioneInput = new TextInputBuilder()
            .setCustomId('descrizione')
            .setLabel('Descrizione')
            .setPlaceholder('Descrivi il server o il progetto in modo chiaro...')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(1000)
            .setRequired(true);

        const linkInput = new TextInputBuilder()
            .setCustomId('link')
            .setLabel('Link di invito (opzionale)')
            .setPlaceholder('https://discord.gg/...')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(titoloInput),
            new ActionRowBuilder().addComponents(descrizioneInput),
            new ActionRowBuilder().addComponents(linkInput)
        );

        await interaction.showModal(modal);
    },

    async handleModalSubmit(interaction) {
        const titolo      = interaction.fields.getTextInputValue('titolo');
        const descrizione = interaction.fields.getTextInputValue('descrizione');
        const link        = interaction.fields.getTextInputValue('link') || null;

        const managerId  = interaction.customId.split('-')[1];
        const managerUser = managerId !== 'none'
            ? await interaction.client.users.fetch(managerId).catch(() => null)
            : null;

        const config      = db.getServer(interaction.guild.id);
        const partnerRole = config?.pingRole || null;
        const partnerChannel = config?.partnerChannel || null;

        // Salva il partner nel DB
        if (!config.partners) config.partners = [];
        config.partners.push({
            title: titolo,
            description: descrizione,
            link: link,
            manager: managerUser ? managerUser.tag : null,
            author: interaction.user.tag,
            addedAt: Date.now()
        });
        db.setServer(interaction.guild.id, config);

        const embed = new EmbedBuilder()
            .setTitle(`🤝 Nuova Partnership — ${titolo}`)
            .setDescription(descrizione)
            .setColor(0xFF66CC)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .addFields(
                {
                    name: '🔗 Link',
                    value: link ? `[Clicca qui per unirti](${link})` : '`Nessun link fornito`',
                    inline: false
                },
                {
                    name: '👤 Inviato da',
                    value: `${interaction.user}`,
                    inline: true
                },
                {
                    name: '🏠 Server',
                    value: `\`${interaction.guild.name}\``,
                    inline: true
                },
                {
                    name: '📋 Manager',
                    value: managerUser ? `${managerUser}` : '`Nessuno assegnato`',
                    inline: true
                },
                {
                    name: '🔔 Ping',
                    value: partnerRole ? `<@&${partnerRole}>` : '`Nessun ruolo impostato`',
                    inline: true
                }
            )
            .setFooter({ text: `Partnership • ${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setTimestamp();

        const targetChannel = partnerChannel
            ? interaction.guild.channels.cache.get(partnerChannel)
            : interaction.channel;

        if (!targetChannel) {
            return interaction.reply({
                content: '❌ Il canale partnership non è stato trovato. Usa `/partner-setup` per configurarlo.',
                ephemeral: true
            });
        }

        await targetChannel.send({
            content: partnerRole ? `<@&${partnerRole}>` : '',
            embeds: [embed]
        });

        await interaction.reply({
            content: `✅ Partnership **${titolo}** inviata con successo in ${targetChannel}!`,
            ephemeral: true
        });
    }
};
