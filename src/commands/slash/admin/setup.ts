import { Button, RegisterType, SlashCommand } from '../../../handler';
import {
  ActionRowBuilder,
  AutocompleteInteraction,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextChannel,
} from 'discord.js';

export default new SlashCommand({
  registerType: RegisterType.Guild,

  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup modules')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('Channel where you want to setup the module')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('module') // Renamed from 'topic' to 'module'
        .setDescription('Choose a module from the suggestions')
        .setAutocomplete(true)
        .setRequired(true),
    ) as SlashCommandBuilder,

  async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
    const focusedValue: string = interaction.options.getFocused().toLowerCase();
    const choices: string[] = [
      'Ticket',
      'Booster',
    ];

    const filtered: string[] = choices.filter((choice) =>
      choice.toLowerCase().includes(focusedValue),
    );
    await interaction.respond(
      filtered.map((choice) => ({ name: choice, value: choice })),
    );
  },

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Updated variable name: selectedModule
    const selectedModule: string = interaction.options.getString('module', true);
    const channel = interaction.options.getChannel('channel') as TextChannel;

    switch (selectedModule.toLowerCase()) {
      case 'ticket': {

        await channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('Yo, need help?')
              .setDescription(
                'No worries, Just pick a category, open a ticket.\nGive us all the necessary details about it and let our support team sort things out for you.',
              )
              .setColor('#F1B754'),
          ],
          components: [
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId('dropdown_ticket')
                .setPlaceholder('Select an option')
                .addOptions([
                  new StringSelectMenuOptionBuilder()
                    .setLabel('I need help with an order')
                    .setDescription('Select this option if you have issue with your order')
                    .setEmoji('💸')
                    .setValue('ticket_order'),
                  new StringSelectMenuOptionBuilder()
                    .setLabel('I have a doubt/problem')
                    .setDescription('Select this option if you have any questions or issues')
                    .setEmoji('❓')
                    .setValue('ticket_doubt'),
                  new StringSelectMenuOptionBuilder()
                    .setLabel('I want to report something')
                    .setDescription('Select this option to report an issue or concern')
                    .setEmoji('🚨')
                    .setValue('ticket_report'),
                ]),
            ),
          ],
        });

        await interaction.reply({
          content: `Setup complete in <#${channel.id}> for \`${selectedModule}\`.`,
          ephemeral: true,
        });
        break;
      }

      case 'booster':{
        channel.send({
          embeds: [
            new EmbedBuilder()
            .setColor('#F1B754')
            .setThumbnail('https://cdn.discordapp.com/attachments/1298155159482011691/1334423150678773855/wizard1.png?ex=679c79e7&is=679b2867&hm=90016561b4b78fec80bf58b57a35a142f1269899ae39e98b19e0686cb0214fbb&')
            .setTitle('Yo, wanna join the squad? 🚀')
            .setDescription('We’re always looking for skilled players to joins our boosting team, whether you have a main account, you’re a long time booster, or you re already working on another platform, we’ve got a spot for you.\n\n- **Default Application**:\n```For boosters who’ve got a main account ready to roll.```\n- **Special Application**:\n```For those boosting without a main account or already working on another platform.```\n- **Minimum Requirements**:\n\n- <:lol:1329707998226157619> **Leauge of Legends**\n> <:point:1329708644098506804> BR Server: Grand Master+\n> <:point:1329708644098506804>NA/EUW/EUNE Servers: Master 200 LP+\n\n- <:valorant:1329707851094167552> **Valorant**\n> <:point:1329708644098506804> Imortal 2+\n\n- <:tft:1329708007642107956> Teamfight Tactics\n> <:point:1329708644098506804> Master+')
          ],
          components: [
            new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
              .setCustomId('application:default')
              .setStyle(ButtonStyle.Secondary)
              .setLabel('Default Application'),

              new ButtonBuilder()
              .setCustomId('application:special')
              .setStyle(ButtonStyle.Secondary)
              .setLabel('Special Application')
            )
          ]
        })
      }
        break;

      default:
        await interaction.reply({ content: 'Unknown module', ephemeral: true });
        break;
    }
  },
});
