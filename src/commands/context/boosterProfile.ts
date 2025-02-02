import { ContextMenu, RegisterType } from '../../handler';
import axios from 'axios';
import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  ContextMenuCommandInteraction,
  MessageFlags,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
  ContextMenuCommandType,
  TextChannel,  // Add this import
  BaseGuildTextChannel, // Add this import
} from 'discord.js';
import { createTranscript } from 'discord-html-transcripts';
import { v2 as cloudinary } from 'cloudinary';
import defaultConfig from 'src/config';

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  url: string;
}

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default new ContextMenu({
  registerType: RegisterType.Guild,

  data: new ContextMenuCommandBuilder()
    .setName('Booster Profile')
    .setType(ApplicationCommandType.User as ContextMenuCommandType),

  async execute(interaction: ContextMenuCommandInteraction): Promise<void> {
    try {
      // Check if user has HR role
      const member = await interaction.guild?.members.fetch(interaction.user.id);
      const isHR = member?.roles.cache.has(defaultConfig.rolesConfig?.hiringManagerRole!);

      const response = await axios.get(`${process.env.API}/booster/profile/${interaction.targetId}`,
        {
          headers: {
            Authorization: process.env.CLIENT_TOKEN!,
          }
        });
      
      const profile = response.data;
      const targetUser = await interaction.client.users.fetch(interaction.targetId);
      
      const getStatusWithEmoji = (status: string) => {
        switch (status?.toLowerCase()) {
          case 'pending':
            return '<:spinner:1334802528575029330> Pending';
          case 'approved':
            return '✅ Approved';
          case 'rejected':
            return '❌ Rejected';
          default:
            return '❔ Unknown';
        }
      };

      const embed = new EmbedBuilder()
        .setColor('#F1B754')
        .setTitle(`Booster Profile - ${targetUser.username}`)
        .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
        .addFields(
          { name: '🎮 Game', value: profile.game?.toUpperCase() || 'Not set', inline: true },
          { name: '🌍 Region', value: profile.region?.toUpperCase() || 'Not set', inline: true },
          { name: '🏆 Rank', value: profile.rank || 'Not set', inline: true },
          { name: '👤 Full Name', value: profile.customName || 'Not provided', inline: true },
          { name: '📋 Status', value: getStatusWithEmoji(profile.applicationStatus), inline: true },
          { name: '📅 Applied At', value: profile.createdAt ? `<t:${Math.floor(new Date(profile.createdAt).getTime() / 1000)}:R>` : 'Unknown', inline: true }
        )
        .setFooter({ text: `ID: ${interaction.targetId}` })
        .setTimestamp();

      // Only add buttons for HR managers
      const components: ActionRowBuilder<ButtonBuilder>[] = [];
      if (isHR) {
        components.push(
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId(`approve_${interaction.targetId}`)
                .setLabel('Approve')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId(`reject_${interaction.targetId}`)
                .setLabel('Reject')
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId(`update_${interaction.targetId}`)
                .setLabel('Update')
                .setStyle(ButtonStyle.Primary),
            )
        );
      }

      const reply = await interaction.reply({ 
        embeds: [embed],
        components,
      });

      if (isHR) {
        const collector = reply.createMessageComponentCollector({ time: 300000 });

        collector.on('collect', async (i: ButtonInteraction) => {
          if (i.user.id !== interaction.user.id) {
            await i.reply({ content: 'You cannot use these buttons.', flags: [MessageFlags.Ephemeral] });
            return;
          }

          const [action, userId] = i.customId.split('_');

          switch (action) {
            case 'approve':
            case 'reject':
              try {
                // Update status
                await axios.patch(
                  `${process.env.API}/booster/profile/${userId}`,
                  { applicationStatus: action === 'approve' ? 'approved' : 'rejected' },
                  { headers: { Authorization: process.env.CLIENT_TOKEN! } }
                );
              
              // Create transcript
              // In the approve/reject case:
              const channel = await interaction.guild?.channels.fetch('1328971350529933322');
              if (!channel || !(channel instanceof BaseGuildTextChannel)) {
                await i.reply({ 
                  content: `Application ${action}d but couldn't create transcript: Channel not found or not text-based.`,
                  ephemeral: true 
                });
                return;
              }
              
              const transcript = await createTranscript(channel, {
                filename: `${userId}-application.html`,
                saveImages: true,
              });
              
              // Upload to cloudinary
              // When uploading to Cloudinary
              const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                  { 
                    resource_type: 'raw',
                    folder: 'transcripts',
                    public_id: `${userId}-application.html`,  // Add .html extension
                    format: 'html'  // Specify format
                  },
                  (error, result) => {
                    if (error) {
                      console.error('Cloudinary upload error:', error);
                      reject(error);
                    } else {
                      resolve(result as CloudinaryUploadResult);
                    }
                  }
                ).end(Buffer.from(transcript.toString()));
              });
              
              // Save transcript URL
              await axios.patch(
                `${process.env.API}/booster/profile/${userId}`,
                { transcriptFile: result.secure_url },
                { headers: { Authorization: process.env.CLIENT_TOKEN! } }
              );
              
              // DM the user
              // DM the user with better formatting
              const dmEmbed = new EmbedBuilder()
                .setColor(action === 'approve' ? '#00ff00' : '#ff0000')
                .setTitle(action === 'approve' ? '🎉 Application Approved!' : '❌ Application Rejected')
                .setDescription(
                  action === 'approve'
                    ? 'Congratulations! Your application to become a booster has been approved. Welcome to the team! 🎊'
                    : 'We regret to inform you that your application has not been approved at this time. Thank you for your interest.'
                )
                .addFields(
                  { name: '🎮 Game', value: profile.game?.toUpperCase() || 'Not set', inline: true },
                  { name: '🌍 Region', value: profile.region?.toUpperCase() || 'Not set', inline: true },
                  { name: '🏆 Rank', value: profile.rank || 'Not set', inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'EvoBoost Application System' });

              await targetUser.send({
                embeds: [dmEmbed],
                files: [transcript]
              });
              
              // After successful DM and transcript save
              await i.editReply({ 
                embeds: [
                  new EmbedBuilder()
                    .setColor(action === 'approve' ? '#00ff00' : '#ff0000')
                    .setTitle(`Application ${action === 'approve' ? 'Approved' : 'Rejected'}`)
                    .setDescription(`Successfully ${action}d application for ${targetUser.username}`)
                    .setTimestamp()
                ],
                components: [] 
              });

              // Send a followup message to confirm
              await i.followUp({ 
                content: `Application ${action}d successfully and transcript saved!`,
                ephemeral: true
              });
              
            } catch (error: any) {
              console.error(`Error ${action}ing application:`, error);
              await i.reply({ 
                content: `Failed to ${action} application: ${error.message || 'Unknown error'}`,
              });
            }
            break;

            case 'update':
              const modal = new ModalBuilder()
                .setCustomId(`update_modal_${userId}`)
                .setTitle('Update Application')
                .addComponents(
                  new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                      .setCustomId('customName')
                      .setLabel('Full Name')
                      .setValue(profile.customName || '')
                      .setStyle(TextInputStyle.Short)
                      .setRequired(false)
                  ),
                  new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                      .setCustomId('region')
                      .setLabel('Region')
                      .setValue(profile.region || '')
                      .setStyle(TextInputStyle.Short)
                      .setRequired(false)
                  ),
                  new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                      .setCustomId('preferredLanguage')
                      .setLabel('Preferred Language')
                      .setValue(profile.preferredLanguage || '')
                      .setStyle(TextInputStyle.Short)
                      .setRequired(false)
                  ),
                  new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                      .setCustomId('applicationStatus')
                      .setLabel('Status (pending/approved/rejected)')
                      .setValue(profile.applicationStatus || '')
                      .setStyle(TextInputStyle.Short)
                      .setRequired(false)
                  )
                );

              await i.showModal(modal);
              break;
          }
        });

        // Handle modal submit
        interaction.client.on('interactionCreate', async (i) => {
          if (!i.isModalSubmit() || !i.customId.startsWith('update_modal_')) return;

          const userId = i.customId.split('_')[2];
          const updates: Record<string, string> = {};

          for (const [key, value] of i.fields.fields) {
            if (value.value) updates[key] = value.value;
          }

          try {
            await axios.patch(
              `${process.env.API}/booster/profile/${userId}`,
              updates,
              { headers: { Authorization: process.env.CLIENT_TOKEN! } }
            );

            await i.reply({ content: 'Profile updated successfully!' });
          } catch (error) {
            console.error('Error updating profile:', error);
            await i.reply({ content: 'Failed to update profile.'});
          }
        });
      }

    } catch (error: any) {
      console.error('Error fetching profile:', error?.response?.data || error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Error Fetching Profile')
        .setDescription(error?.response?.data?.error || 'Failed to fetch profile')
        .setTimestamp();

      await interaction.reply({ 
        embeds: [errorEmbed],
      });
    }
  },
});
