const { animeSupplemental, manga } = require('#api');
const { PERMISSION_GROUPS, OMNI_ANIME_FORMAT_TYPES, COLORS_HEX } = require('#constants');

const { createDynamicCardStack } = require('#cardstack/index');
const { ResolveCallbackTypes, InteractiveComponentTypes } = require('#cardstack/constants');

const { hexToDecimalColor } = require('#utils/color');
const { createEmbed, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { smallPill, link, pill, stringwrapPreserveWords, timestamp, TIMESTAMP_FLAGS } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const {
  InteractionContextTypes,
  ApplicationIntegrationTypes,
  ApplicationCommandOptionTypes,
} = require('detritus-client/lib/constants');
const { STATIC_ASSETS } = require('#utils/statics');

function renderMangaResultsPage(context, res, includeSupplementalData = true) {
  let result = createEmbed('default', context, {
    author: {
      name: res.title,
      url: res.url,
    },
    description: ``,
    fields: [],
  });

  // Add Metadata to Title
  if (res.dates) {
    if (res.dates.start) {
      if (res.dates.end && new Date(res.dates.start).getFullYear() !== new Date(res.dates.end).getFullYear())
        result.author.name += ` (${new Date(res.dates.start).getFullYear()} - ${new Date(res.dates.end).getFullYear()})`;
      else result.author.name += ` (${new Date(res.dates.start).getFullYear()})`;
    }
  }

  // Render Description
  if (res.subtitle) result.description += `-# ${res.subtitle}\n\n`;
  if (res.type !== 'ANIME') result.description += pill(OMNI_ANIME_FORMAT_TYPES[res.type]) + '   ';
  else {
    if (res.subtype) result.description += pill(OMNI_ANIME_FORMAT_TYPES[res.subtype]) + '   ';
    else result.description += pill(OMNI_ANIME_FORMAT_TYPES[res.type]) + '   ';
  }
  if (res.genres?.length)
    result.description +=
      res.genres
        .splice(0, 3)
        .map(r => smallPill(r))
        .join('   ') + '\n';
  if (res.tags?.length) result.description += '-# ' + res.tags.map(t => smallPill(t)).join('   ') + '\n\n';
  if (res.description) result.description += stringwrapPreserveWords(res.description, 600);
  if (res.attribution?.description) result.description += `\n\n-# Source • ${res.attribution.description}`;

  // Render Images
  if (res.cover) result.thumbnail = { url: res.cover };
  if (res.image) result.image = { url: res.image };

  // Render Color
  if (res.color) result.color = hexToDecimalColor(res.color);

  if (res.chapters) {
    result.fields.push({
      name: 'Chapters',
      value: `${res.chapters}`,
      inline: true,
    });
  }

  if (res.volumes) {
    result.fields.push({
      name: 'Volumes',
      value: `${res.volumes}`,
      inline: true,
    });
  }

  if (res.links) {
    result.fields.push({
      name: 'Links',
      value: res.links.map(l => `${link(l.url, l.label)}`).join('\n'),
      inline: true,
    });
  }

  return page(
    result,
    {},
    includeSupplementalData
      ? {
          // Supplemental keys are provided by the backend,
          // allow for fetching extra data related to results.
          characters_key: res.supplemental.characters,
          related_key: res.supplemental.related,
          name: res.title,
          color: hexToDecimalColor(res.color || COLORS_HEX.embed),
          cover: res.cover,
        }
      : {}
  );
}

module.exports = {
  name: 'manga',
  description: 'Search for Manga.',
  contexts: [InteractionContextTypes.GUILD, InteractionContextTypes.PRIVATE_CHANNEL, InteractionContextTypes.BOT_DM],
  integrationTypes: [ApplicationIntegrationTypes.USER_INSTALL],
  options: [
    {
      name: 'query',
      description: 'Search query.',
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

    if (!args.query) return editOrReply(context, createEmbed('warning', context, `Missing Parameter (query).`));
    try {
      let search = await manga(context, args.query, context.channel.nsfw);
      search = search.response;

      if (search.body.status === 2) return editOrReply(context, createEmbed('error', context, search.body.message));

      let pages = [];
      for (const res of search.body.results) {
        pages.push(renderMangaResultsPage(context, res));
      }

      if (!pages.length) return editOrReply(context, createEmbed('warning', context, `No results found.`));

      createDynamicCardStack(context, {
        cards: pages,
        interactive: {
          characters_button: {
            type: InteractiveComponentTypes.BUTTON,
            label: 'Characters',
            inline: false,
            visible: true,
            condition: page => {
              return page.getState('characters_key') !== null;
            },
            renderLoadingState: pg => {
              return createEmbed('default', context, {
                description: `-# ${pg.getState('name')} › **Characters**`,
                image: {
                  url: STATIC_ASSETS.card_skeleton,
                },
                color: pg.getState('color'),
              });
            },
            resolvePage: async pg => {
              let characters = await animeSupplemental(context, pg.getState('characters_key'));

              let cards = characters.response.body.characters.map(c => {
                let card = createEmbed('default', context, {
                  color: pg.getState('color'),
                  description: `-# ${pg.getState('name')} › **Characters**\n## ${link(c.url, c.name.full)}`,
                  fields: [],
                });

                if (c.description) card.description += `\n\n\n${stringwrapPreserveWords(c.description, 600)}`;
                if (c.image) card.image = { url: c.image };
                if (pg.getState('cover')) card.thumbnail = { url: pg.getState('cover') };

                if (c.age) card.fields.push({ name: 'Age', value: c.age, inline: true });

                return page(card);
              });

              return {
                type: ResolveCallbackTypes.SUBSTACK,
                cards: cards,
              };
            },
          },
          related_button: {
            type: InteractiveComponentTypes.BUTTON,
            label: 'Related',
            inline: false,
            visible: true,
            condition: page => {
              return page.getState('related_key') !== null;
            },
            renderLoadingState: pg => {
              return createEmbed('default', context, {
                description: `-# ${pg.getState('name')} › **Related Content**`,
                image: {
                  url: STATIC_ASSETS.card_skeleton,
                },
                color: pg.getState('color'),
              });
            },
            resolvePage: async pg => {
              let episodes = await animeSupplemental(context, pg.getState('related_key'));

              let cards = episodes.response.body.relations.map(e => renderMangaResultsPage(context, e, false));

              return {
                type: ResolveCallbackTypes.SUBSTACK,
                cards: cards,
              };
            },
          },
        },
      });
    } catch (e) {
      if (e.response?.body?.status === 1)
        return editOrReply(context, createEmbed('warning', context, e.response?.body?.message));
      if (e.response?.body?.status === 2)
        return editOrReply(context, createEmbed('warning', context, e.response?.body?.message));

      console.log(e);
      return editOrReply(context, createEmbed('error', context, `Unable to perform anime search.`));
    }
  },
};
