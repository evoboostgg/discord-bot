import { SelectMenu } from '../../handler';
import type { AnySelectMenuInteraction } from 'discord.js';

import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

import { Ticket } from 'src/database/schema/ticket';

export default new SelectMenu({
  customId: 'dropdown_ticket',

  async execute(interaction: AnySelectMenuInteraction, values: string[], uniqueIds: (string | null)[]): Promise<void> {
    const choice: string = values[0];
    // Convert the select-menu choice to the Ticket schema type
    const typeMapping: Record<string, 'order' | 'doubt' | 'report'> = {
      'ticket_order': 'order',
      'ticket_doubt': 'doubt',
      'ticket_report': 'report',
    };

    // If the choice doesn’t exist in our map, we can exit early
    if (!typeMapping[choice]) {
      await interaction.reply({ content: 'Unknown choice', ephemeral: true });
      return;
    }

    const mappedType = typeMapping[choice];

    // 1) Check if the user already has an open ticket of this type
    const openTicket = await Ticket.findOne({
      userId: interaction.user.id,
      type: mappedType,
      status: 'open',
    });

    if (openTicket) {
      // The user already has an open ticket of this type
      // Show ephemeral message with link or mention of the existing channel
      await interaction.reply({
        content: `You already have an open ticket in <#${openTicket.channelId}>`,
        ephemeral: true,
      });
      return;
    }

    // 2) If no open ticket, handle normally based on the choice
    switch (choice) {
      case 'ticket_order':
        // Show a modal with 3 fields: username, subject, description
        await showOrderModal(interaction);
        break;

      case 'ticket_doubt':
        // Show a modal with 2 fields: subject, description
        await showDoubtModal(interaction);
        break;

      case 'ticket_report':
        // Show 2 buttons: "Report a user" and "Report something else"
        await showReportButtons(interaction);
        break;

      default:
        await interaction.reply({ content: 'Unknown choice', ephemeral: true });
        break;
    }
  },
});

async function showOrderModal(interaction: AnySelectMenuInteraction) {
  const modal = new ModalBuilder()
    .setCustomId('modal_ticket_order')
    .setTitle('Order Ticket');

  const usernameInput = new TextInputBuilder()
    .setCustomId('ticket_order_id')
    .setLabel('Order Id')
    .setPlaceholder('Enter your order id here')
    .setStyle(TextInputStyle.Short);

  const subjectInput = new TextInputBuilder()
    .setCustomId('ticket_orer_subject')
    .setLabel('Subject')
    .setPlaceholder('Enter a short subject here')
    .setStyle(TextInputStyle.Short);

  const descriptionInput = new TextInputBuilder()
    .setCustomId('ticket_orer_description')
    .setLabel('Description')
    .setPlaceholder('Provide details about your order issue')
    .setStyle(TextInputStyle.Paragraph);

  const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(usernameInput);
  const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(subjectInput);
  const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);

  modal.addComponents(row1, row2, row3);
  await interaction.showModal(modal);
}

async function showDoubtModal(interaction: AnySelectMenuInteraction) {
  const modal = new ModalBuilder()
    .setCustomId('modal_ticket_doubt')
    .setTitle('Doubt Ticket');

  const subjectInput = new TextInputBuilder()
    .setCustomId('ticket_doubt_subject')
    .setLabel('Subject')
    .setPlaceholder('Enter a short subject')
    .setStyle(TextInputStyle.Short);

  const descriptionInput = new TextInputBuilder()
    .setCustomId('ticket_doubt_description')
    .setLabel('Description')
    .setPlaceholder('Describe your doubt')
    .setStyle(TextInputStyle.Paragraph);

  const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(subjectInput);
  const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);

  modal.addComponents(row1, row2);
  await interaction.showModal(modal);
}

async function showReportButtons(interaction: AnySelectMenuInteraction) {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_button:report_user')
      .setLabel('Report a user')
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId('ticket_button:report_other')
      .setLabel('Report something else')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({
    content: 'Please choose one of the options below to proceed with your report.',
    components: [row],
    ephemeral: true
  });
}
