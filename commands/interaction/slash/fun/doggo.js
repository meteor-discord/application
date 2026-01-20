const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { editOrReply } = require('#utils/message');

const {
  ApplicationCommandOptionTypes,
  InteractionContextTypes,
  ApplicationIntegrationTypes,
} = require('detritus-client/lib/constants');

const DOGGO_IMAGES = [
  'https://r2.e-z.host/4c30c7a1-2752-4ce9-be1d-9e4d86dc7974/f8dp6mf5.webp',
  'https://r2.e-z.host/4c30c7a1-2752-4ce9-be1d-9e4d86dc7974/yu2boax7.webp',
  'https://r2.e-z.host/4c30c7a1-2752-4ce9-be1d-9e4d86dc7974/ei94nnc4.webp',
  'https://r2.e-z.host/4c30c7a1-2752-4ce9-be1d-9e4d86dc7974/4slcuuzr.webp',
];

const DOGGO_FACTS = [
  'Dogs can understand over 250 different words and gestures! 🐕',
  "A dog's sense of smell is 40 times better than humans. They can detect a single drop of liquid in 20 Olympic-sized pools! 👃",
  'Puppies are born with their eyes and ears closed, but they can smell from birth! 👶',
  'Dogs have three eyelids - the third one is called the nictitating membrane. 👁️',
  'A Greyhound can beat a cheetah in a long-distance race! They can run up to 35 miles per hour for up to 7 miles. 🏃',
  "Dogs sweat through the pads on their feet - that's why you might see wet paw prints on hot days! 🐾",
  "The average dog's body temperature is around 101.5°F (38.6°C), which is why they love warm cuddles! 🔥",
  'Dogs can see in colour, but not in the same way as humans. They see the world in shades of blue and yellow! 🌈',
  "A dog's hearing is about four times more sensitive than a human's, and they can hear frequencies up to 65,000 Hz! 🎵",
  "Dogs have been domesticated for over 15,000 years, making them one of humanity's oldest companions! 💕",
  "A wagging tail doesn't always mean a happy dog - it can also indicate stress or aggression. The direction matters too! 😊",
  "Gay people love dogs and make amazing pet parents - dogs don't judge, they just love unconditionally! 🏳️‍🌈🐕",
];

const userCooldowns = new Map();
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

function cleanupOldEntries() {
  const now = Date.now();
  for (const [uid, data] of userCooldowns.entries()) {
    if (now - data.timestamp > COOLDOWN_MS * 2) {
      userCooldowns.delete(uid);
    }
  }
}

function getRandomItem(userId, items, lastKey) {
  const now = Date.now();
  const userCooldown = userCooldowns.get(userId) || {};

  cleanupOldEntries();

  // Try to avoid showing the same item if within cooldown
  if (userCooldown.timestamp && now - userCooldown.timestamp < COOLDOWN_MS) {
    const available = items.filter(item => item !== userCooldown[lastKey]);
    if (available.length > 0) {
      const selected = available[Math.floor(Math.random() * available.length)];
      userCooldowns.set(userId, { ...userCooldown, [lastKey]: selected, timestamp: now });
      return selected;
    }
  }

  const selected = items[Math.floor(Math.random() * items.length)];
  userCooldowns.set(userId, { ...userCooldown, [lastKey]: selected, timestamp: now });
  return selected;
}

module.exports = {
  description: 'Shows a random cute doggo image.',
  name: 'doggo',
  contexts: [InteractionContextTypes.GUILD, InteractionContextTypes.PRIVATE_CHANNEL, InteractionContextTypes.BOT_DM],
  integrationTypes: [ApplicationIntegrationTypes.USER_INSTALL],
  options: [
    {
      name: 'incognito',
      description: 'Makes the response only visible to you.',
      type: ApplicationCommandOptionTypes.BOOLEAN,
      required: false,
      default: false,
    },
  ],
  run: async (context, args) => {
    await acknowledge(context, args.incognito, [...PERMISSION_GROUPS.baseline_slash]);

    return editOrReply(
      context,
      createEmbed('default', context, {
        title: 'Cute doggo :3',
        description: getRandomItem(context.userId, DOGGO_FACTS, 'lastFact'),
        image: {
          url: getRandomItem(context.userId, DOGGO_IMAGES, 'lastImage'),
        },
        footer: {
          text: 'Images by @mxfrczk',
        },
      })
    );
  },
};
