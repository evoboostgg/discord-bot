import type {
  ContextMenuCommandInteraction,
  GatewayIntentBits,
  Interaction,
  Message,
  MessageReplyOptions,
} from 'discord.js';

export interface Config {
  prefix: string;
  ownerId?: string;
  eventsFolder: string;
  commandsFolder: string;
  componentsFolder: string;
  defaultIntents: GatewayIntentBits[];
  deniedCommandReplies: any;
  logChannelConfig?: LogChannelConfig;
  rolesConfig?: RolesConfig,
}

export interface LogChannelConfig {
  channelId: string;
  message: (
    context: Interaction | ContextMenuCommandInteraction | Message,
    commandName: string,
    commandType: string,
  ) => Promise<MessageReplyOptions>;
}

export interface RolesConfig {
  hiringManagerRole: string,
}