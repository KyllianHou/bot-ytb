const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
} = require('discord.js');
const NotificationConfig = require('../../models/NotificationConfig');

/** @param {import('commandkit').SlashCommandProps} param0 */
async function run({ interaction }) {
    try {
        await interaction.deferReply({ ephemeral: true });

        const targetYtChannelId = interaction.options.getString('youtube-id');
        const targetNotificationChannel =
            interaction.options.getChannel('target-channel');

        const targetChannel = await NotificationConfig.findOne({
            ytChannelId: targetYtChannelId,
            notificationChannelId: targetNotificationChannel.id,
        });

        if (!targetChannel) {
            interaction.followUp(
                'Aucune configuration pour cette chaîne YouTube.'
            );
            return;
        }

        NotificationConfig.findOneAndDelete({ _id: targetChannel._id })
            .then(() => {
                interaction.followUp(
                    'Désactivation des notifications pour cette chaîne !'
                );
            })
            .catch((e) => {
                interaction.followUp(
                    'Il y a eu une erreur dans la DataBase, merci de réessayer dans quelques instants.'
                );
            });
    } catch (error) {
        console.log(`Erreur dans ${__filename}:\n`, error);
    }
}

const data = new SlashCommandBuilder()
    .setName('notification-remove')
    .setDescription('Désactive les notifications pour la chaîne YouTube.')
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
            .setDescription('Le salon dans lequel désactiver les notifications.')
            .addChannelTypes(
                ChannelType.GuildText,
                ChannelType.GuildAnnouncement
            )
            .setRequired(true)
    );

module.exports = { data, run };
