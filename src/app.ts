import { ActivityType, GatewayIntentBits, Partials } from 'discord.js';

import { Client } from '~/structures/client';

if (!process.versions.bun)
  throw new Error('Bun runtime is required to run this application. Please install Bun from https://bun.sh/.');

export const client = new Client({
  intents: Object.values(GatewayIntentBits) as GatewayIntentBits[],
  partials: Object.values(Partials) as Partials[],
  allowedMentions: {
    repliedUser: false,
  },
  presence: {
    activities: [
      {
        name: `Running on ${Bun.spawnSync(['git', 'rev-parse', '--short', 'HEAD']).stdout.toString().trim()}`,
        type: ActivityType.Custom,
      },
    ],
  },
});

(async () => await client.init())();
