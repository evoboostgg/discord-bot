import { conncectDatabase } from 'src/database/connection';
import { Event, ExtendedClient } from '../handler';
import { ActivityType, Events, PresenceUpdateStatus } from 'discord.js';

export default new Event({
  name: Events.ClientReady,
  once: true,
  async execute(client: ExtendedClient): Promise<void> {
    await conncectDatabase()
    client.user?.setStatus(PresenceUpdateStatus.Online);
    client.user?.setActivity('Aplpha Testing', { type: ActivityType.Watching });
  },
});
