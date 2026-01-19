const { lyrics } = require('#api');
const { paginator } = require('#client');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed, formatPaginationEmbeds, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { smallIconPill, smallPill } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATICS } = require('#utils/statics');

const {
  ApplicationCommandOptionTypes,
  InteractionContextTypes,
  ApplicationIntegrationTypes,
} = require('detritus-client/lib/constants');

const META_FIELDS = {
  Album: 'album',
  Released: 'note',
};

function renderMetadata(track) {
  const metadata = track.metadata;
  const pills = [];
  for (const m of metadata) {
    if (!META_FIELDS[m.id]) continue;
    pills.push(`${smallIconPill(META_FIELDS[m.id], `${m.id}`)} ${smallPill(m.value)}`);
  }
  return pills.join('\n');
}

// These have to be synced with the backend (search_service/endpoints/lyrics).
const LYRIC_PROVIDERS = {
  UNKNOWN_PROVIDER: 0,
  MUSIXMATCH: 1,
  GENIUS: 2,
  LRCLIB: 3,
};

function renderLyricsFooter(context, provider) {
  switch (provider) {
    case LYRIC_PROVIDERS.MUSIXMATCH:
      return {
        text: `Musixmatch • ${context.application.name}`,
        iconUrl: STATICS.musixmatch,
      };
    case LYRIC_PROVIDERS.GENIUS:
      return {
        text: `Genius • ${context.application.name}`,
        iconUrl: STATICS.genius,
      };
    case LYRIC_PROVIDERS.LRCLIB:
      return {
        text: `LRCLib • ${context.application.name}`,
      };
    default: // Fallback, this should never happen
      return {
        text: context.application.name,
        iconUrl: STATICS.labscore,
      };
  }
}

function createLyricsPage(context, body, fields) {
  const em = createEmbed('default', context, {
    author: {
      name: `${body.track.title}`,
    },
    description: `-# Song by ${body.track.artist}`,
    fields,
    footer: renderLyricsFooter(context, body.lyrics_provider),
  });
  if (body.track.cover) em.thumbnail = { url: body.track.cover };
  if (body.track.metadata?.length) em.description += `\n\n${renderMetadata(body.track)}`;
  return em;
}

module.exports = {
  name: 'lyrics',
  description: 'Search for song lyrics.',
  contexts: [InteractionContextTypes.GUILD, InteractionContextTypes.PRIVATE_CHANNEL, InteractionContextTypes.BOT_DM],
  integrationTypes: [ApplicationIntegrationTypes.USER_INSTALL],
  options: [
    {
      name: 'artist',
      description: 'Artist name.',
      type: ApplicationCommandOptionTypes.STRING,
      required: true,
    },
    {
      name: 'song',
      description: 'Song name.',
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
    await acknowledge(context, args.incognito, [...PERMISSION_GROUPS.baseline_slash]);

    try {
      // Combine artist and song into a single query
      const query = `${args.artist} ${args.song}`;
      let search = await lyrics(context, query);
      search = JSON.parse(search.response.text);
      const body = search.response.body;

      if (body.status === 2) return editOrReply(context, createEmbed('error', context, body.message));
      if (body.status === 1) return editOrReply(context, createEmbed('warning', context, body.message || 'No lyrics found.'));
      if (!body.track) return editOrReply(context, createEmbed('warning', context, 'No lyrics found.'));
      const fields = [];

      for (const f of (body.lyrics || '').split('\n\n')) {
        fields.push({
          name: '​',
          value: f.replace(/\[(.*?)\]/g, '-# [$1]').substr(0, 1024),
          inline: false,
        });
      }

      const pages = [];
      while (fields.length) {
        let pageFields = fields.splice(0, 3);

        // Display less fields if they take up too much vertical space
        while (
          pageFields
            .map(f => f.value)
            .join('\n')
            .split('\n').length >= 30 &&
          pageFields[1]
        ) {
          fields.unshift(pageFields[pageFields.length - 1]);
          pageFields = pageFields.splice(0, pageFields.length - 1);
        }

        pages.push(page(createLyricsPage(context, body, pageFields)));
      }

      await paginator.createPaginator({
        context,
        pages: formatPaginationEmbeds(pages),
      });
    } catch (e) {
      console.log(JSON.stringify(e) || e);
      return editOrReply(context, createEmbed('error', context, `Something went wrong.`));
    }
  },
};
