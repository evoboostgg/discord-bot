import { Event } from '../handler';
import { Events, Message } from 'discord.js';

export default new Event({
  name: Events.MessageCreate,
  once: true,
  async execute(message: Message): Promise<void> {
    // if(message.channel)
  },
});
