import {
    AutocompleteInteraction,
    Collection,
    ContextMenuCommandBuilder,
    ContextMenuCommandInteraction,
    Message,
    SlashCommandBuilder
} from "discord.js";

export enum CommandTypes {
    SlashCommand = "SlashCommand",
    PrefixCommand = "PrefixCommand",
    MessageCommand = "MessageCommand",
    PingCommand = "PingCommand",
    ContextMenu = "ContextMenu"
}

export enum RegisterTypes {
    Guild = "applicationGuildCommands",
    Global = "applicationCommands"
}

export interface CommandCollections {
    slash: Collection<string, SlashCommandModule>;
    prefix: Collection<string, PrefixCommandModule>;
    message: Collection<string, MessageCommandModule>;
    ping: Collection<string, PingCommandModule>;
    context: Collection<string, ContextMenuCommandModule>;
    aliases: CommandCollectionsAliases
}

export interface CommandCollectionsAliases {
    slash: Collection<string, string>;
    prefix: Collection<string, string>;
    message: Collection<string, string>;
    ping: Collection<string, string>;
    context: Collection<string, string>;
}

export interface CooldownCollections {
    user: Collection<string, Collection<string, number>>;
}

interface BaseCommandModule {
    cooldown?: number;
    ownerOnly?: boolean;
    userWhitelist?: string[];
    userBlacklist?: string[];
    channelWhitelist?: string[];
    channelBlacklist?: string[];
    guildWhitelist?: string[];
    guildBlacklist?: string[];
    roleWhitelist?: string[];
    roleBlacklist?: string[];
    nsfw?: boolean;
    disabled?: boolean;
}

export interface SlashCommandModule extends BaseCommandModule {
    type: CommandTypes.SlashCommand;
    register: RegisterTypes;
    data: SlashCommandBuilder;
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
    execute: (...args: any[]) => Promise<void>;
}

export interface PrefixCommandModule extends BaseCommandModule {
    name: string;
    aliases?: string[];
    permissions?: string[];
    type: CommandTypes.PrefixCommand;
    execute: (message: Message) => Promise<void>;
}

export interface MessageCommandModule extends BaseCommandModule {
    name: string;
    aliases?: string[];
    permissions?: string[];
    type: CommandTypes.MessageCommand;
    execute: (message: Message) => Promise<void>;
}

export interface PingCommandModule extends BaseCommandModule {
    name: string;
    aliases?: string[];
    permissions?: string[];
    type: CommandTypes.PingCommand;
    execute: (message: Message) => Promise<void>;
}

export interface ContextMenuCommandModule extends BaseCommandModule {
    type: CommandTypes.ContextMenu;
    register: RegisterTypes;
    data: ContextMenuCommandBuilder;
    execute: (interaction: ContextMenuCommandInteraction) => Promise<void>;
}

export interface RegisterCommandOptions {
    deploy: boolean;
}