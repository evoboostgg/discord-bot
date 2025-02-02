import {
  ButtonInteraction,
  EmbedBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
  TextChannel,
  Message,
} from 'discord.js';
import axios from 'axios';
import { Button } from 'src/handler/components/base/Button';
import { getValorantPeakRank } from 'src/helper/getRanks/valorant';
import { getLeaugeOfLegendsPeakRank } from 'src/helper/getRanks/league_of_legends';
import { getTeamfightTacticsPeak } from 'src/helper/getRanks/teamfight_tactics';
import defaultConfig from 'src/config';

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE HELPER: determines if the rank is too low
function isRankTooLow(game: string, peakRank: string): boolean {
  if (game === 'valorant') {
    // Example: Valorant must be Immortal or Radiant
    const rankLower = peakRank.toLowerCase();
    return !(rankLower.includes('immortal 2') || rankLower.includes('immortal 3') || rankLower.includes('radiant')) 
  } else {
    // Example: LoL/TFT must be Platinum or higher
    const acceptableRanks = ['Master', 'Grandmaster', 'Challenger'];
    return !acceptableRanks.some((r) => peakRank.toLowerCase().includes(r.toLowerCase()));
  }
}

// Main Button handler definition
export default new Button({
  customId: 'application',

  async execute(interaction: ButtonInteraction, uniqueId: string | null): Promise<void> {
    if (!uniqueId) return;

    if(uniqueId === 'special') {
      await interaction.reply({ 
        content: 'This feature is currently disabled.',
        flags: [MessageFlags.Ephemeral]
      })
    }
    // 1) Default or special => show the language selector
    if (uniqueId === 'default') {
      await languageSelector(interaction);
    }

    // 2) Language selected
    if (uniqueId.startsWith('lang_')) {
      const selectedLanguage = uniqueId.split('_')[1];
      await gameSelector(interaction, selectedLanguage);
    }

    // 3) Game selected
    if (uniqueId.startsWith('game_')) {
      const [language, game] = uniqueId.split('_').slice(1);
      await regionSelector(interaction, game, language);
    }

    // 4) Region selected
    if (uniqueId.startsWith('region_')) {
      const [language, region, game] = uniqueId.split('_').slice(1);
      console.log(game)
      await handleRegionSelection(interaction, region, language, game);
    }

    // 5) If the user clicked on the "Start" button
    if (uniqueId.startsWith('start_')) {
      const [_, language, region, game] = uniqueId.split('_');
      // now you have language, region, and game from the customId
      await handleStartButton(interaction, language, region, game);
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// LANGUAGE SELECTOR
async function languageSelector(interaction: ButtonInteraction) {
  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle('🌐 Select Your Language | Selecione Seu Idioma')
        .setDescription(
          'Please select your preferred language for the application process.\n\n' +
            'Por favor, selecione o idioma de sua preferência para o processo de inscrição.',
        )
        .setColor('#F1B754')
        .setFooter({ text: 'Make your selection below | Faça sua seleção abaixo.' }),
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('application:lang_english')
          .setLabel('🇬🇧 English')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('application:lang_portuguese')
          .setLabel('🇧🇷 Português')
          .setStyle(ButtonStyle.Primary),
      ),
    ],
    flags: [MessageFlags.Ephemeral],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME SELECTOR
async function gameSelector(interaction: ButtonInteraction, language: string) {
  const embedTitle = language === 'portuguese' ? '🎮 Selecione Seu Jogo' : '🎮 Select Your Game';
  const description =
    language === 'portuguese'
      ? 'Por favor, selecione o jogo para o qual deseja se inscrever.'
      : 'Please select the game you want to apply for.';

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle(embedTitle)
        .setDescription(description)
        .setColor('#F1B754')
        .setFooter({
          text: language === 'portuguese' ? 'Faça sua seleção abaixo.' : 'Make your selection below.',
        }),
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`application:game_${language}_league_of_legends_default`)
          .setLabel('League of Legends')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`application:game_${language}_valorant_default`)
          .setLabel('Valorant')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`application:game_${language}_teamfight_tactics_default`)
          .setDisabled(true)
          .setLabel('Teamfight Tactics')
          .setStyle(ButtonStyle.Primary),
      ),
    ],
    flags: [MessageFlags.Ephemeral],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// REGION SELECTOR
async function regionSelector(interaction: ButtonInteraction, game: string, language: string) {
  const embedTitle =
    language === 'portuguese' ? `🌍 Selecione Sua Região para ${game}` : `🌍 Select Your Region for ${game}`;
  const description =
    language === 'portuguese'
      ? `Por favor, selecione a região de onde você está se inscrevendo para ${game}.`
      : `Please select the region you are applying from for ${game}.`;

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle(embedTitle)
        .setDescription(description)
        .setColor('#F1B754')
        .setFooter({
          text: language === 'portuguese' ? 'Faça sua seleção abaixo.' : 'Make your selection below.',
        }),
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`application:region_${language}_na_${game}`)
          .setLabel(language === 'portuguese' ? 'América do Norte (NA)' : 'North America (NA)')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`application:region_${language}_eu_${game}`)
          .setLabel(language === 'portuguese' ? 'Europa (EU)' : 'Europe (EU)')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`application:region_${language}_br_${game}`)
          .setLabel(language === 'portuguese' ? 'Brasil (BR)' : 'Brazil (BR)')
          .setStyle(ButtonStyle.Primary),
      ),
    ],
    flags: [MessageFlags.Ephemeral],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// REGION SELECTION => SHOW MODAL => CREATE CHANNEL => SEND CONFIRMATION
async function handleRegionSelection(interaction: ButtonInteraction, region: string, language: string, game: string) {
  // 1) Show the modal to get userTag
  const modal = new ModalBuilder()
    .setCustomId(`application_modal_${language}_${region}`)
    .setTitle(language === 'portuguese' ? 'Por favor, insira seu user#tag' : 'Please enter your user#tag')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('userTagInput')
          .setLabel(
            language === 'portuguese' ? 'Insira seu user#tag (ex: user#1234)' : 'Enter your user#tag (e.g., user#1234)',
          )
          .setPlaceholder(language === 'portuguese' ? 'Digite seu user#tag aqui' : 'Enter your user#tag here')
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
      ),
    );

  await interaction.showModal(modal);

  // 2) Collector for modal submissions
  const filter = (i: ModalSubmitInteraction) =>
    i.customId === `application_modal_${language}_${region}` && i.user.id === interaction.user.id;

  const timeout = setTimeout(() => {
    interaction.followUp({
      content:
        language === 'portuguese'
          ? 'Tempo esgotado para enviar a resposta.'
          : 'Time expired for submitting the response.',
      ephemeral: true,
    });
  }, 60000); // 60s timeout

  interaction.client.on('interactionCreate', async (i) => {
    if (i.isModalSubmit() && filter(i)) {
      clearTimeout(timeout);

      // Use ephemeral reply so others don't see partial info
      await i.deferReply({ flags: [MessageFlags.Ephemeral] });

      const userTag = i.fields.getTextInputValue('userTagInput');
      try {
        // 3) Fetch peak rank
        let peakRank = 'Unranked';
        if (game === 'valorant') {
          peakRank = await getValorantPeakRank(userTag);
        } else if (game.includes('league')) {  // Changed this line
          peakRank = await getLeaugeOfLegendsPeakRank(userTag) || 'Unranked';
        } else if (game.includes('teamfight_tactics')) {  // Changed this line for consistency
          peakRank = await getTeamfightTacticsPeak(userTag);
        }

        // 3a) Check rank
        if (isRankTooLow(game, peakRank)) {
          const tooLowMessage =
            language === 'portuguese'
              ? `Seu rank é ${peakRank}, não atende aos nossos requisitos.`
              : `Your rank is ${peakRank}, it doesn't meet our requirements.`;
          await i.editReply({ content: tooLowMessage });
          return;
        }

        // 3b) (NEW) Attempt to create application via your Express API
        // Only proceed if the API call is successful
        // Add this helper function at the top with other helpers
        function mapRegionToGame(game: string, region: string): string {
          if (game.includes('league')) {  // Changed this condition
            switch (region) {
              case 'na': return 'na1';
              case 'eu': return 'euw1';
              case 'br': return 'br1';
              default: return region;
            }
          }
          return region;
        }

        try {
          const response = await axios.post(
            `${process.env.API}/apply`,
            {
              discordId: i.user.id,
              game: game.includes('league') ? 'league_of_legends' : game.replace('_default', ''),
              applicationType: 'default',
              applicationLanguage: language,
              region: mapRegionToGame(game, region),  // This will now map correctly
              rank: peakRank,
              agreedToTerms: true,
            },
            {
              headers: {
                // The token your Express server expects in req.headers.authorization
                Authorization: process.env.CLIENT_TOKEN!,
              },
            },
          );

          // If the server responded with 201, application is created
          if (response.status === 201) {
            // Let user know we're working on channel creation
            await i.editReply({
              content:
                language === 'portuguese'
                  ? 'Criando sua inscrição, este processo pode levar alguns segundos.'
                  : 'Creating your application, this process might take a few seconds.',
            });

            // 4) Create a new channel for the applicant
            const channel = (await interaction.guild?.channels.create({
              name: `${i.user.username}-application`,
              parent: '1330106345466368021', // Replace with your category ID
              topic: 'Booster Application',
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
                {
                  id: '1334411183737798677', // HR Role
                  allow: [
                    'SendMessages',
                    'SendVoiceMessages',
                    'ViewChannel',
                    'ReadMessageHistory',
                    'AttachFiles',
                    'EmbedLinks',
                  ],
                }
              ],
            })) as TextChannel;

            // 5) Send final embed with user details
            await sendConfirmationEmbed(channel, userTag, peakRank, language, game, region);

            await i.editReply({
              content:
                language === 'portuguese'
                  ? `O canal de inscrição foi criado com sucesso! ${channel}`
                  : `The application channel has been successfully created! ${channel}`,
            });
          } else {
            // If the API call didn't return 201, show the error
            await i.editReply({
              content:
                language === 'portuguese'
                  ? `Não foi possível criar sua inscrição. Resposta da API: ${response.status}`
                  : `Could not create your application. API responded with status: ${response.status}`,
            });
          }
        } catch (apiError: any) {
          // If the API call fails (e.g. 400, 409, etc.), handle the error
          const msg = apiError?.response?.data?.error || apiError.message || apiError;
          console.error('API error:', msg);

          await i.editReply({
            content:
              language === 'portuguese'
                ? `Falha ao criar sua inscrição na API: ${msg}`
                : `Failed to create your application via API: ${msg}`,
          });
          return;
        }
      } catch (error) {
        console.error('Rank fetch error:', error);
        await i.reply({
          content:
            language === 'portuguese'
              ? 'Erro ao buscar o rank. Tente novamente mais tarde.'
              : 'Error fetching rank. Please try again later.',
          flags: [MessageFlags.Ephemeral],
        });
      }
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SEND THE FINAL EMBED (INCLUDING REGION, PEAK RANK, ETC.)
export async function sendConfirmationEmbed(
  channel: TextChannel,
  userTag: string,
  peakRank: string,
  language: string,
  game: string,
  region: string,
) {
  const startLabel = language === 'portuguese' ? 'Começar' : 'Start';
  const username = channel.name.replace('-application', '');
  const guild = channel.guild;
  const targetMember = guild?.members.cache.find((m) => m.user.username.toLowerCase() === username.toLowerCase());

  // Fixed the swapped descriptions
  const description =
    language === 'portuguese'
      ? `Muito obrigado pelo seu interesse em fazer parte da equipe!\nPor favor, siga a instruções do bot nas próximas etapas e lembre se de inserir apenas informações verdadeiras!\n\nVamos começar`
      : `Thanks for your application ${targetMember}\nPlease follow my instructions in the next steps.\n\nShare only accurate and true information.\nLet's Start`;

  const embed = new EmbedBuilder()
    .setTitle(
      language === 'portuguese'
        ? `Inscrição para Booster - ${game.toUpperCase()}`
        : `Booster Application - ${game.toUpperCase()}`
    )
    .setDescription(description)
    .setColor('#F1B754')
    .setTimestamp();

  // Send embed + two link buttons
  await channel.send({
    embeds: [embed],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`application:start_${language}_${region}_${game}`)
          .setLabel(startLabel)
          .setStyle(ButtonStyle.Primary),
      ),
    ],
  });
}


async function handleStartButton(interaction: ButtonInteraction, language: string, region: string, game: string) {
  const username = interaction.user.username;

  const greeting =
    language === 'portuguese'
      ? `**Saudações, @${username}**\nParece que você cumpre os requisitos mínimos...\nPosso saber seu **NOME COMPLETO?**`
      : `**Greetings, @${username}**\nLooks like you meet our minimum requirements...\nCan you let me know your **FULL NAME?**`;

  await interaction.reply({
    content: greeting,
  });

  // First collector: Collect user’s full name
  const channel = interaction.channel as TextChannel;
  const collector = channel.createMessageCollector({
    filter: (msg: Message) => msg.author.id === interaction.user.id,
    time: 300_000, // 5 minutes in milliseconds
  });

  collector.on('collect', async (message: Message) => {
    const customName = message.content.trim();
    collector.stop();

    try {
      // Update the application with the custom name
      await axios.patch(
        `${process.env.API}/booster/profile/${interaction.user.id}`,
        {
          customName: customName
        },
        {
          headers: {
            Authorization: process.env.CLIENT_TOKEN!,
          },
        }
      );

      await message.reply({
        content: `**${customName}**! ${language === 'portuguese' ? 'Obrigado. Vamos para a próxima etapa...' : 'Thank you. Let\'s proceed to the next step...'}`,
      });

      // ----- Next Step: Provide legal link and ask for TOS confirmation -----

      // Decide which link to use
      const docLink =
        language === 'portuguese'
          ? 'ps://docs.google.com/document/d/1Tqeb_CKJhT4k8DCdBWlEbQskL2GrjbEVqq5Q7Bq49p4/edit?usp=sharing'
          : 'https://docs.google.com/document/d/1HZDwFAPJsr3Kn7h64egAkv2LTIPzExWXto3BzCVm0Fo/edit?usp=sharing';

      // Decide which phrase they must type
      const confirmPhrase =
        language === 'portuguese'
          ? 'Confirmo que li e estou de acordo com os Termos da ICA'
          : 'I confirm that I read and I Agree to the ICA Terms';

      // Send a message prompting them to review legal terms and type the confirm phrase
      await message.reply({
        content:
          language === 'portuguese'
            ? `Nice name... agora vamos falar de assuntos legais.\nAqui está o link: ${docLink}\nSe você concorda com todos os termos, por favor digite:\n\`\`\`${confirmPhrase}\`\`\``
            : `Nice name... now let's talk a bit about legal things.\nHere is the link: ${docLink}\nIf you agree to all the terms, please type:\n\`\`\`${confirmPhrase}\`\`\``,
      });
      

      // Second collector: Collect TOS confirmation
      const tosCollector = channel.createMessageCollector({
        filter: (msg: Message) => msg.author.id === interaction.user.id,
        time: 300000000000000,
      });

      tosCollector.on('collect', async (tosMsg: Message) => {
        if (tosMsg.content.trim() === confirmPhrase) {
          tosCollector.stop();
          
          try {
            await axios.patch(
              `${process.env.API}/booster/profile/${interaction.user.id}`,
              {
                agreedToTerms: true
              },
              {
                headers: {
                  Authorization: process.env.CLIENT_TOKEN!,
                },
              }
            );

            await tosMsg.reply({
              content:
                language === 'portuguese'
                  ? `Tudo certo, meu trabalho aqui está feito! Agora vou te conectar com um <@&${defaultConfig.rolesConfig?.hiringManagerRole}>, por favor aguarde.`
                  : `All right, my job here is done! Now I will connect you with a , <@&${defaultConfig.rolesConfig?.hiringManagerRole}> please wait.`,
            });
          } catch (error) {
            console.error('Error updating terms agreement:', error);
            await tosMsg.reply({
              content: language === 'portuguese'
                ? 'Erro ao atualizar os termos. Por favor, tente novamente.'
                : 'Error updating terms agreement. Please try again.',
            });
          }
        }
      });
    } catch (error) {
      console.error('Error updating custom name:', error);
      await message.reply({
        content: language === 'portuguese'
          ? 'Erro ao atualizar o nome personalizado. Por favor, tente novamente.'
          : 'Error updating custom name. Please try again.',
      });
    }

    collector.on('end', async (collected, reason) => {
      if (reason === 'time') {
        await channel.send(
          language === 'portuguese'
            ? 'Tempo esgotado! Você não forneceu seu nome completo.'
            : 'Time is up! You did not provide your full name.',
        );
      }
    });
})
}


