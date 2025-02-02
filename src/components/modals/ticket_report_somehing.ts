import { Modal } from '../../handler';
import {
  ModalSubmitInteraction,
  ModalSubmitFields,
  TextChannel,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from 'discord.js';
import { Ticket } from 'src/database/schema/ticket';
import { getNextTicketId } from 'src/helper/ticketId';

export default new Modal({
  customId: 'modal_ticket_report:something',

  async execute(interaction: ModalSubmitInteraction, fields: ModalSubmitFields): Promise<void> {

    const isEnabled = false

    if(isEnabled === false) {
     interaction.reply({ content: 'Ticket feature is not available at the moment.\nError: ONLY SUPPORTS PROD BUILD ' }) 
     return;
    }
    
    const categoryId = '1318900583318421575';

    const subject: string = fields.getTextInputValue('ticket_report_something:subject');
    const description: string = fields.getTextInputValue('ticket_report_something:description');

    const ticketId = getNextTicketId('R');

    const newTicket = await Ticket.create({
      ticketId,
      channelId: '',
      userId: interaction.user.id,
      type: 'report', 
      subject,
      description,
      status: 'open',

    });

    const channel = (await interaction.guild?.channels.create({
      name: `report-${interaction.user.username}`,
      parent: categoryId,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone.id,
          deny: ['ViewChannel', 'SendMessages'],
        },
        {
          id: interaction.user.id,
          allow: [
            'SendMessages',
            'SendVoiceMessages',
            'ViewChannel',
            'ReadMessageHistory',
            'AttachFiles',
            'EmbedLinks',
          ],
          deny: ['MentionEveryone'],
        },
      ],
    })) as TextChannel;

    newTicket.channelId = channel.id;
    await newTicket.save();

    const embed = new EmbedBuilder()
      .setTitle(`Ticket #${ticketId} - Help with an Report`)
      .setDescription(
        `**Subject**: ${subject}\n` +
        `**Description**: ${description}\n\n` +
        `**Status**: Open\n` +
        `**User**: <@${interaction.user.id}>\n`,
      )
      .setColor('#2F3136')
      .setTimestamp();

    const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('close_ticket') 
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger),
    );

    await channel.send({
      content: `<@${interaction.user.id}>`, 
      embeds: [embed],
      components: [closeRow],
    });

    await interaction.reply({
      content: `Your ticket has been created in <#${channel.id}>!`,
      flags: MessageFlags.Ephemeral,
    });
  },
});
