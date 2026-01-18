const { youtube } = require('#api');
const { paginator } = require('#client');
const { YOUTUBE_CATEGORIES, PERMISSION_GROUPS } = require('#constants');

const { createEmbed, formatPaginationEmbeds, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { link, iconPill, timestamp } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATICS } = require('#utils/statics');

const {
  ApplicationCommandOptionTypes,
  InteractionContextTypes,
  ApplicationIntegrationTypes,
} = require('detritus-client/lib/constants');

// TODO: Move this to a numbers utility
// https://www.html-code-generator.com/javascript/shorten-long-numbers
const intToString = num => {
  num = num.toString().replace(/[^0-9.]/g, '');
  if (num < 1000) return num;

  const si = [
    { v: 1e3, s: 'K' },
    { v: 1e6, s: 'M' },
    { v: 1e9, s: 'B' },
    { v: 1e12, s: 'T' },
    { v: 1e15, s: 'P' },
    { v: 1e18, s: 'E' },
  ];
  let index;
  for (index = si.length - 1; index > 0; index--) {
    if (num >= si[index].v) break;
  }
  return (num / si[index].v).toFixed(2).replace(/\.0+$|(\.\d*[1-9])0+$/, '$1') + si[index].s;
};

function createYoutubePage(context, result) {
  let res;
  let iconHeader;
  switch (result.type) {
    case 1: //video
      iconHeader = [];

      iconHeader.push(
        iconPill('stat_views', intToString(parseInt(result.metadata.views).toLocaleString('en-US')) + ' Views')
      );
      if (result.metadata.likes >= 1)
        iconHeader.push(iconPill('stat_likes', intToString(parseInt(result.metadata.likes)) + ' Likes'));
      if (result.metadata.comments >= 1)
        iconHeader.push(
          '\n' + iconPill('stat_comments', intToString(parseInt(result.metadata.comments)) + ' Comments')
        );

      res = page(
        createEmbed('default', context, {
          author: {
            name: result.channel.name,
            url: result.channel.url,
            iconUrl: result.channel.icon,
          },
          description: `### ${link(result.url, result.name)}\n-# Uploaded ${timestamp(result.date, 'R')}\n\n${iconHeader.join(' ​ ​ ​ ​')}\n\n${result.description}`,
          image: {
            url: result.image,
          },
          footer: {
            iconUrl: STATICS.youtube,
            text: `YouTube • ${context.application.name}`,
          },
        })
      );
      break;
    case 2: // channel
      iconHeader = [];

      iconHeader.push(
        iconPill(
          'stat_people',
          intToString(parseInt(result.metadata.subscribers).toLocaleString('en-US')) + ' Subscribers'
        )
      );
      iconHeader.push(
        iconPill('stat_views', intToString(parseInt(result.metadata.views).toLocaleString('en-US')) + ' Views')
      );

      iconHeader.push(
        '\n' +
          iconPill('stat_videos', intToString(parseInt(result.metadata.videos).toLocaleString('en-US')) + ' Videos')
      );

      res = page(
        createEmbed('default', context, {
          author: {
            name: result.name,
            url: result.url,
            iconUrl: result.icon,
          },
          description: `-# Created ${timestamp(result.date, 'R')}\n\n${iconHeader.join(' ​ ​ ​ ​')}\n\n${result.description}`,
          thumbnail: {
            url: result.icon,
          },
          footer: {
            iconUrl: STATICS.youtube,
            text: `YouTube • ${context.application.name}`,
          },
        })
      );
      break;
    case 3: // playlist
      iconHeader = [
        iconPill('stat_videos', intToString(parseInt(result.metadata.videos).toLocaleString('en-US')) + ' Videos'),
      ];
      res = page(
        createEmbed('default', context, {
          author: {
            name: result.channel.name,
            url: result.channel.url,
            iconUrl: result.channel.icon,
          },
          description: `### ${link(result.url, result.name)}\n-# Created ${timestamp(result.date, 'R')}\n\n${iconHeader.join(' ​ ​ ​ ​')}\n\n${result.description}`,
          thumbnail: {
            url: result.image,
          },
          footer: {
            iconUrl: STATICS.youtube,
            text: `YouTube • ${context.application.name}`,
          },
        })
      );
      break;
    default:
      break;
  }
  return res;
}

module.exports = {
  name: 'youtube',
  description: 'Search for videos on YouTube.',
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
      name: 'type',
      default: 'all',
      type: 'string',
      help: `Video Category`,
    },
    {
      name: 'type',
      description: 'Type of videos to search.',
      required: false,
      choices: [
        {
          value: 'all',
          name: 'All Videos',
        },
        {
          value: 'music',
          name: 'Music',
        },
        {
          value: 'shows',
          name: 'Shows',
        },
        {
          value: 'sports',
          name: 'Sports',
        },
        {
          value: 'gaming',
          name: 'Gaming',
        },
        {
          value: 'education',
          name: 'Education',
        },
        {
          value: 'howto',
          name: 'How-To',
        },
        {
          value: 'news',
          name: 'News',
        },
      ],
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
      if (!args.type) args.type = 'all';

      if (args.type == 'all') args.type = undefined;
      else {
        if (!YOUTUBE_CATEGORIES[args.type.toLowerCase()])
          return editOrReply(context, createEmbed('warning', context, `Invalid Parameter (type).`));
        args.type = YOUTUBE_CATEGORIES[args.type.toLowerCase()];
      }
      let search = await youtube(context, args.query, args.type);
      search = search.response;

      const pages = [];
      for (const res of search.body.results) {
        pages.push(createYoutubePage(context, res));
      }

      await paginator.createPaginator({
        context,
        pages: formatPaginationEmbeds(pages),
      });
    } catch (e) {
      console.log(e);
      return editOrReply(context, createEmbed('error', context, `Unable to perform youtube search.`));
    }
  },
};
