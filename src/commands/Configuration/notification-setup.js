const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder,
} = require('discord.js');

const NotificationConfig = require('../../models/NotificationConfig');
const Parser = require('rss-parser');

const parser = new Parser();

/** @param {import('commandkit').SlashCommandProps} param0 */
async function run({ interaction }) {
    try {
        await interaction.deferReply({ ephemeral: true });

        const targetYtChannelId = interaction.options.getString('youtube-id');
        const targetNotificationChannel = interaction.options.getChannel('target-channel');
        const targetCustomMessage = interaction.options.getString('custom-message');

        const duplicateExists = await NotificationConfig.exists({
            notificationChannelId: targetNotificationChannel.id,
            ytChannelId: targetYtChannelId,
        });

        if (duplicateExists) {
            interaction.followUp(
                'La chaîne YouTube a déjà été configurée pour ce salon..\nUtilisez la commande `/notification-remove` avant de réessayer.'
            );
            return;
        }

        const YOUTUBE_RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${targetYtChannelId}`;

        const feed = await parser.parseURL(YOUTUBE_RSS_URL).catch((e) => {
            interaction.followUp(
                'Une erreur est survenue. Vérifiez que le lien est correct.'
            );
        });

        if (!feed) return;

        const channelName = feed.title;

        const notificationConfig = new NotificationConfig({
            guildId: interaction.guildId,
            notificationChannelId: targetNotificationChannel.id,
            ytChannelId: targetYtChannelId,
            customMessage: targetCustomMessage,
            lastChecked: new Date(),
            lastCheckedVid: null,
        });

        if (feed.items.length) {
            const latestVideo = feed.items[0];

            notificationConfig.lastCheckedVid = {
                id: latestVideo.id.split(':')[2],
                pubDate: latestVideo.pubDate,
            };
        }

        notificationConfig
            .save()
            .then(() => {
                const embed = new EmbedBuilder()
                    .setTitle('✅ Configuration de la chaîne YouTube réalisée avec succès !')
                    .setDescription(
                        `${targetNotificationChannel} recevra une notification lorsque ${channelName} postera une vidéo.`
                    )
                    .setTimestamp();

                interaction.followUp({ embeds: [embed] });
            })
            .catch((e) => {
                interaction.followUp(
                    'Erreur de la DataBase innatendue. Veuillez réessayer dans quelques instants.'
                );
            });
    } catch (error) {
        console.log(`Erreur dans ${__filename}:\n`, error);
    }
}

const data = new SlashCommandBuilder()
    .setName('notification-setup')
    .setDescription('Configurer une alerte pour une chaîne YouTube.')
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
        option
            .setName('youtube-id')
            .setDescription('Le lien de la chaîne YouTube.')
            .setRequired(true)
    )
    .addChannelOption((option) =>
        option
            .setName('target-channel')
            .setDescription('Le salon dans lequel doit apparaitre la notification')
            .addChannelTypes(
                ChannelType.GuildText,
                ChannelType.GuildAnnouncement
            )
            .setRequired(true)
    )
    .addStringOption((option) =>
        option
            .setName('custom-message')
            .setDescription(
                'Templates: {VIDEO_TITLE} {VIDEO_URL} {CHANNEL_NAME} {CHANNEL_URL}'
            )
    );

module.exports = { data, run };