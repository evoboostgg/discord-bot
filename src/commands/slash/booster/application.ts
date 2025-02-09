import { RegisterType, SlashCommand } from '../../../handler';
import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  TextChannel,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { Application } from '../../../database/schema/applications';
import defaultConfig from 'src/config';

export default new SlashCommand({
  registerType: RegisterType.Guild,

  data: new SlashCommandBuilder()
    .setName('application')
    .setDescription('Manage applications')
    .addSubcommand((option) =>
      option
        .setName('procceed')
        .setDescription('Procceed an application')
        .addStringOption((option) =>
          option
            .setName('messagelink')
            .setDescription('The message link')
            .setRequired(true)
        )
        .addUserOption((option) =>
          option
            .setName('applicant')
            .setDescription('The user who applied')
            .setRequired(true)
        )
    )
    .addSubcommand((option) => 
      option
      .setName('approve')
     .setDescription('Approve an application')
    .addUserOption((option) =>
      option
       .setName('applicant')
       .setDescription('The user who applied')
       .setRequired(true)
)
    ) 
   .addSubcommand((option) =>
      option
       .setName('deny')
       .setDescription('Deny an application')
       .addUserOption((option) =>
          option
           .setName('applicant')
           .setDescription('The user who applied')
           .setRequired(true)
        )
        .addStringOption((option) =>
          option
          .setName('reason')
          .setDescription('The reason for denying the application')
          .setRequired(true)
        )
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {

    switch (interaction.options.getSubcommand()) {
      case 'procceed':  {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
          const messageLink = interaction.options.getString('messagelink', true);
          const applicant = interaction.options.getUser('applicant', true);
          
          // Fix message link parsing
          const linkRegex = /^https?:\/\/(?:ptb\.|canary\.)?discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)$/;
          const matches = messageLink.match(linkRegex);
          
          if (!matches) {
            await interaction.editReply('Please provide a valid Discord message link.');
            return;
          }
    
          const [, guildId, channelId, messageId] = matches;
    
          const channel = interaction.client.channels.cache.get(channelId) as TextChannel;
          if (!channel) {
            await interaction.editReply('Invalid channel or message link.');
            return;
          }
    
          const message = await channel.messages.fetch(messageId);
          if (!message) {
            await interaction.editReply('Message not found.');
            return;
          }
    
          const embed = message.embeds[0];
          if (!embed) {
            await interaction.editReply('No embed found in the message.');
            return;
          }
    
          const applicationData: any = {
            status: 'pending',
            discordId: applicant.id,
            discord: applicant.username
          };
    
          embed.fields?.forEach(field => {
            const name = field.name.replace(/__/g, '').trim();
            
            const content = field.value.split('```')[1].trim();
            const lines = content.split('\n').filter(line => line.includes(': '));
    
            switch (name) {
              case 'Role Information':
                applicationData.appliedRole = lines[0].split(': ')[1].toLowerCase();
                break;
              case 'Personal Information':
                lines.forEach(async line => {
                  const [key, value] = line.split(': ');
                  switch (key) {
                    case 'Display Name':
                      applicationData.displayName = value;
                      break;
                    case 'Email':
                      applicationData.email = value.toLowerCase();
                      break;
                    case 'Discord':
                      applicationData.discord = value;
                      break;
                    case 'Region':
                      applicationData.region = value.toLowerCase();
                      break;
                    case 'Availability':
                      applicationData.availability = value.split(' ')[0];
                      break;
                  }
                });
                break;
              case 'Legal Information':
                lines.forEach(line => {
                  const [key, value] = line.split(': ');
                  switch (key) {
                    case 'Legal Name':
                      applicationData.legalName = value;
                      break;
                    case 'Birth Location':
                      applicationData.birthLocation = value.split(', ')[1].toLowerCase();
                      break;
                    case 'Street':
                      applicationData.street = value;
                      break;
                    case 'City':
                      applicationData.city = value;
                      break;
                    case 'Postcode':
                      applicationData.postcode = value;
                      break;
                    case 'Country':
                      applicationData.country = value.toLowerCase();
                      break;
                  }
                });
                break;
              default:
                // Handle game experience sections
                if (name.includes('Experience')) {
                  const gameName = name.replace(' Experience', '').toLowerCase();
                  applicationData.game = gameName === 'league of legends' ? 'league_of_legends' : 
                                       gameName === 'teamfight tactics' ? 'teamfight_tactics' : 
                                       'valorant';
    
                  lines.forEach(line => {
                    const [key, ...valueParts] = line.split(': ');
                    const value = valueParts.join(': '); // Rejoin in case proof URL contains colons
    
                    switch (key) {
                      case 'Peak Rank':
                        applicationData.peakRank = value.toLowerCase();
                        break;
                      case 'Proof':
                        applicationData.proof = value;
                        break;
                    }
                  });
    
                  // Get experience text (last line after "Experience:")
                  const experienceIndex = content.indexOf('Experience:');
                  if (experienceIndex !== -1) {
                    applicationData.experience = content.slice(experienceIndex).split('\n')[1].trim();
                  }
                }
                break;
            }
          });
    
          // After parsing all fields, show confirmation
          const confirmationEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Application Review')
            .setDescription('Please review the application details before proceeding.')
            .addFields([
              { name: 'Role', value: applicationData.appliedRole || 'Not provided', inline: true },
              { name: 'Display Name', value: applicationData.displayName || 'Not provided', inline: true },
              { name: 'Discord', value: applicationData.discord || 'Not provided', inline: true },
              { name: 'Email', value: applicationData.email || 'Not provided', inline: true },
              { name: 'Region', value: applicationData.region || 'Not provided', inline: true },
              { name: 'Availability', value: applicationData.availability || 'Not provided', inline: true },
              { name: 'Game', value: applicationData.game || 'Not provided', inline: true },
              { name: 'Peak Rank', value: applicationData.peakRank || 'Not provided', inline: true },
            ])
            .setTimestamp();
    
          const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('proceed')
                .setLabel('Proceed')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId('cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger),
            );
    
          const response = await interaction.editReply({
            embeds: [confirmationEmbed],
            components: [row]
          });
    
          try {
            const confirmation = await response.awaitMessageComponent({
              filter: i => i.user.id === interaction.user.id,
              time: 60000
            });
    
            if (confirmation.customId === 'cancel') {
              await interaction.editReply({
                content: 'Application process cancelled.',
                embeds: [],
                components: []
              });
              return;
            }
    
            if (confirmation.customId === 'proceed') {
              await confirmation.update({
                content: 'Processing application...',
                embeds: [],
                components: []
              });
    
              // Save application
              const application = new Application(applicationData);
              await application.save();
    
              // Create private channel and send DM
              const category = await interaction.guild?.channels.fetch('1335695453924102214');
              const privateChannel = await interaction.guild?.channels.create({
                name: `${applicationData.discord}-application`,
                type: ChannelType.GuildText,
                parent: category?.id,
                permissionOverwrites: [
                  {
                    id: interaction.guild!.id,
                    deny: ['ViewChannel'],
                  },
                  {
                    id: applicationData.discordId,
                    allow: ['ViewChannel', 'ReadMessageHistory', 'SendMessages', 'AttachFiles', 'EmbedLinks', 'AddReactions'],
                  },
                  {
                    id: defaultConfig.rolesConfig?.hiringManagerRole as string,
                    allow: ['ViewChannel', 'ReadMessageHistory', 'SendMessages', 'AttachFiles', 'EmbedLinks', 'AddReactions'],
                  }
                ],
              });

              // Create application details embed
              const applicationEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('📝 New Application')
                .setDescription(`Application from <@${applicationData.discordId}>`)
                .addFields([
                  { name: '👤 Core Information', value: [
                    `Display Name: ${applicationData.displayName}`,
                    `Email: ${applicationData.email}`,
                    `Discord: ${applicationData.discord}`,
                    `Region: ${applicationData.region.toUpperCase()}`,
                    `Availability: ${applicationData.availability} hours/week`
                  ].join('\n'), inline: false },
                  { name: '👮‍♀️ Legal Information', value: [
                    `Legal Name: ${applicationData.legalName}`,
                    `Birth Location: ${applicationData.birthLocation}`,
                    `Address: ${applicationData.street}, ${applicationData.city}`,
                    `Postcode: ${applicationData.postcode}`,
                    `Country: ${applicationData.country.toUpperCase()}`
                  ].join('\n'), inline: false },
                  { name: '🎮 Game Experience', value: [
                    `Game: ${applicationData.game.replace(/_/g, ' ').toUpperCase()}`,
                    `Peak Rank: ${applicationData.peakRank}`,
                    `Proof: ${applicationData.proof}`,
                    `Experience: ${applicationData.experience}`
                  ].join('\n'), inline: false }
                ])
                .setFooter({ text: 'Application ID: ' + application.id })
                .setTimestamp();

              await privateChannel?.send({
                content: `<@${applicationData.discordId}> <@&${defaultConfig.rolesConfig?.hiringManagerRole}>`,
                embeds: [applicationEmbed]
              });
    
              // Send DM to applicant
              const member = await interaction.guild?.members.fetch(applicationData.discordId);
              const welcomeEmbed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('🎉 Application Received!')
                .setDescription(`Hello ${member?.user.username}! Your application has been successfully processed.`)
                .addFields(
                  { name: 'Next Steps', value: 'Our team will review your application and contact you for an interview soon.' },
                  { name: 'Application Channel', value: `You can track your application status in ${privateChannel}` }
                )
                .setFooter({ text: 'EVO Boost Team' })
                .setTimestamp();
    
              await member?.send({ embeds: [welcomeEmbed] });
    
              await interaction.editReply(`✅ Application processed!\n• Private channel created: ${privateChannel}\n• DM notification sent`);
    
              await interaction.editReply('Application successfully processed and saved to database.');
    
            } 
          } catch (error) {
            await interaction.editReply({
              content: 'Confirmation not received within 1 minute, operation cancelled.',
              embeds: [],
              components: []
            });
          }
        } catch (error: any) {
          console.error('Error processing application:', error);
          await interaction.editReply(`Error: ${error.message}`);
        }
        break;
      }

      case 'approve': {
        await interaction.deferReply();
        const applicant = interaction.options.getUser('applicant', true);

        const data = await Application.findOne({ discordId: applicant.id });
        if (!data) {
          await interaction.editReply('Application not found.');
          return;
        }

        if (data.status !== 'pending') {
          await interaction.editReply(`Cannot approve this application. Current status: ${data.status}`);
          return;
        }

        data.status = 'approved';
        await data.save();

        // send a beautiful Congratulation DM to applicant 
        try {
          const components = data.appliedRole === 'booster' ? [
            new ActionRowBuilder<ButtonBuilder>()
              .addComponents(
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Link)
                  .setLabel('Booster Manual')
                  .setURL('https://docs.google.com/document/d/1txKGTxpGaiHuXX-RUxWcsyndJy5KffvPuV4zFauegGM/edit?tab=t.0#heading=h.9do2jh6rbsrm')
              )
          ] : [];

          const formattedData = {
            Role: data.appliedRole.toUpperCase(),
            Game: data.game.replace(/_/g, ' ').toUpperCase(),
            Region: data.region.toUpperCase(),
            'Peak Rank': data.peakRank.charAt(0).toUpperCase() + data.peakRank.slice(1),
            Availability: `${data.availability} hours/week`
          };

          await applicant.send({
            embeds: [
              new EmbedBuilder()
                .setTitle('🎉 Welcome to EVO Boost Team!')
                .setDescription([
                  '### Congratulations! Your application has been approved! 🌟',
                  '',
                  '> You are now officially part of our team. We are excited to have you on board!',
                  '',
                  data.appliedRole === 'booster' ? '**Please read the Booster Manual carefully for important information.**' : '',
                  '',
                  '### Your Application Details:'
                ].join('\n'))
                .addFields(
                  Object.entries(formattedData).map(([key, value]) => ({
                    name: key,
                    value: value,
                    inline: true
                  }))
                )
                .setColor('#00ff00')
                .setFooter({ text: 'EVO Boost Team' })
                .setTimestamp(),
            ],
            components
          });
        } catch (error) {
          console.log(error)
        }

        await interaction.editReply('Application approved.');

        break;
      }

      case 'deny': {
        await interaction.deferReply();
        const applicant = interaction.options.getUser('applicant', true);
        const reason = interaction.options.getString('reason', true);
        const data = await Application.findOne({ discordId: applicant.id });
        if (!data) {
          await interaction.editReply('Application not found.');
          return;
        }

        if (data.status !== 'pending') {
          await interaction.editReply(`Cannot deny this application. Current status: ${data.status}`);
          return;
        }

        data.status = 'rejected';
        await data.save();
        await applicant.send({
          embeds: [
            new EmbedBuilder()
             .setTitle('❌ Application Denied')
             .setDescription('Your application has been denied.')
             .addFields(
              { name: 'Reason', value: reason || 'No reason provided' }
             )
             .setColor('#ff0000')
             .setFooter({ text: 'EVO Boost Team' })
             .setTimestamp(),
          ],
        });
        await interaction.editReply('Application denied.');
        break;
      }
    
      default:
        break;
    }
   
  },
});
