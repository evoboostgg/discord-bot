import { Button } from '../../handler';
import { ActionRowBuilder, AnySelectMenuInteraction, ButtonInteraction, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { createTranscript } from 'discord-html-transcripts';
import { Ticket } from 'src/database/schema/ticket';
export default new Button({
  customId: 'ticket_button',

  async execute(interaction: ButtonInteraction, uniqueId: string | null): Promise<void> {
    switch (uniqueId) {
        case 'report_user': {
            showReportUserModal(interaction)
        }
            
            break;

            case 'report_other': {
                showReportSomethingElseModal(interaction)
            }

            case 'close_ticket': {
                let data = await Ticket.findOne({ channelId: interaction.channel?.id, })

                const user = interaction.guild?.members.cache.get(data?.userId!)
                const transcriptChannel = interaction.guild?.channels.cache.get('1328123569519202365')
                
                
              }
    
        default:
            break;
    }
  },
});


async function showReportUserModal(interaction: ButtonInteraction) {
    const modal = new ModalBuilder()
      .setCustomId('modal_ticket_report:user')
      .setTitle('Ticket');
  
    const usernameInput = new TextInputBuilder()
      .setCustomId('ticket_report_user:username')
      .setLabel('Username')
      .setPlaceholder('Enter username here')
      .setStyle(TextInputStyle.Short);
  
    const subjectInput = new TextInputBuilder()
      .setCustomId('ticket_report_user:subject')
      .setLabel('Subject')
      .setPlaceholder('Enter a short subject here')
      .setStyle(TextInputStyle.Short);
  
    const descriptionInput = new TextInputBuilder()
      .setCustomId('ticket_report_user:description')
      .setLabel('Description')
      .setPlaceholder('Provide details about your order issue')
      .setStyle(TextInputStyle.Paragraph);
  
    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(usernameInput);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(subjectInput);
    const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);
  
    modal.addComponents(row1, row2, row3);
    await interaction.showModal(modal);
  }

  async function showReportSomethingElseModal(interaction: ButtonInteraction) {
    const modal = new ModalBuilder()
      .setCustomId('modal_ticket_report:something')
      .setTitle('Ticket');
  
    
  
    const subjectInput = new TextInputBuilder()
      .setCustomId('ticket_report_something:subject')
      .setLabel('Subject')
      .setPlaceholder('Enter a short subject here')
      .setStyle(TextInputStyle.Short);
  
    const descriptionInput = new TextInputBuilder()
      .setCustomId('ticket_report_something:description')
      .setLabel('Description')
      .setPlaceholder('Provide details about your report')
      .setStyle(TextInputStyle.Paragraph);
  
    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(subjectInput);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput);
  
    modal.addComponents(row1, row2);
    await interaction.showModal(modal);
  }