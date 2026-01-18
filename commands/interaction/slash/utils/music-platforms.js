const { PERMISSION_GROUPS } = require('#constants');
const { renderMusicButtons } = require('#utils/buttons');
const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { editOrReply } = require('#utils/message');

const {
  ApplicationCommandOptionTypes,
  InteractionContextTypes,
  ApplicationIntegrationTypes,
} = require('detritus-client/lib/constants');

const superagent = require('superagent');

const urlr =
  /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.\S{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.\S{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.\S{2,}|www\.[a-zA-Z0-9]+\.\S{2,})/g;

module.exports = {
  name: 'music-platforms',
  description: 'Get links for a song across all streaming platforms.',
  contexts: [InteractionContextTypes.GUILD, InteractionContextTypes.PRIVATE_CHANNEL, InteractionContextTypes.BOT_DM],
  integrationTypes: [ApplicationIntegrationTypes.USER_INSTALL],
  options: [
    {
      name: 'url',
      description: 'Song URL.',
      type: ApplicationCommandOptionTypes.STRING,
      required: true,
    },
    {
      name: 'incognito',
      description: 'Makes the response only visible to you.',
      type: ApplicationCommandOptionTypes.BOOLEAN,
      required: false,
      default: false,
    },
  ],
  run: async (context, args) => {
    try {
      await acknowledge(context, args.incognito, [...PERMISSION_GROUPS.baseline_slash]);

      const urls = args.url.match(urlr);
      if (urls) {
        try {
          const songlink = await superagent.get(
            `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(urls[0])}`
          );
          const song = songlink.body.entitiesByUniqueId[songlink.body.entityUniqueId];

          const btns = renderMusicButtons(songlink.body.linksByPlatform);
          return editOrReply(context, {
            embeds: [
              createEmbed('defaultNoFooter', context, {
                author: {
                  name: `${song.title} by ${song.artistName}`.substr(0, 1000),
                  iconUrl: song.thumbnailUrl,
                  url: urls[0],
                },
              }),
            ],
            components: btns,
          });
        } catch {
          return editOrReply(context, createEmbed('warning', context, 'No results found.'));
        }
      } else {
        return editOrReply(context, createEmbed('warning', context, 'No urls found.'));
      }
    } catch {
      console.log(e);
      await editOrReply(context, createEmbed('error', context, 'Unable to look up song url.'));
    }
  },
};
