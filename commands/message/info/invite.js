const { paginator } = require('#client');
const { DISCORD_INVITES, OPEN_SOURCE_REPOSITORY_URL, PERMISSION_GROUPS } = require('#constants');

const { createEmbed, formatPaginationEmbeds, page } = require('#utils/embed');
const { guildFeaturesField } = require('#utils/fields');
const { getGuildIcon } = require('#utils/guilds');
const { acknowledge } = require('#utils/interactions');
const { icon, timestamp, iconPill, iconLinkPill, link, smallIconPill, smallPill } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATIC_ASSETS } = require('#utils/statics');

module.exports = {
  name: 'invite',
  label: 'invite',
  aliases: ['inviteinfo'],
  metadata: {
    description: 'Displays information about a discord invite code.',
    description_short: 'Information about discord invite links',
    examples: ['invite discord-townhall'],
    category: 'info',
    usage: 'invite <invite code>',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    await acknowledge(context);

    if (!args.invite)
      return editOrReply(context, {
        content:
          link(
            'https://canary.discord.com/application-directory/' + context.client.user.id + ' ',
            '󠄴',
            'App Directory Invite',
            true
          ) + link(DISCORD_INVITES.invite + ' ', '󠄴', 'Meteor Support Server', true),
        embeds: [
          createEmbed('default', context, {
            description: [
              '⠀',
              iconLinkPill(
                'link',
                context.application.oauth2UrlFormat().replace('ptb.discordapp.com', 'discord.com'),
                'Invite Link (Enable User Commands)',
                'Discord Application Invite URL'
              ),
              iconLinkPill('robot', DISCORD_INVITES.support, 'Support Server', 'Meteor Support Server'),
              iconLinkPill('gitlab', OPEN_SOURCE_REPOSITORY_URL, 'Source Code'),
            ].join('\n'),
            image: {
              url: STATIC_ASSETS.embed_invite_spacer,
            },
          }),
        ],
      });
    try {
      const inviteCode = args.invite.match(
        /(?:(?:https|http):\/\/)?(?:(?:discord.gg|(?:discord|discordapp)\.com\/invite)\/)?([A-z0-z-]{2,64})/
      );
      const invite = await context.client.rest.fetchInvite(inviteCode[1], { withCounts: true });

      const g = invite.guild;
      // Guild Card

      let gDesc = '';
      if (g.description) gDesc = g.description + '\n\n';
      let inviteCard = createEmbed('default', context, {
        author: {
          name: g.name,
          iconUrl: getGuildIcon(g),
          url: `https://discord.gg/${inviteCode[1]}`,
        },
        description: `-# discord.gg/${inviteCode[1]}\n${iconPill('user_multiple', invite.approximateMemberCount.toLocaleString())} ​ ​ • ​ ​ ${smallIconPill('status_online', invite.approximatePresenceCount.toLocaleString())}​ ​ ​ ${smallIconPill('status_offline', (invite.approximateMemberCount - invite.approximatePresenceCount).toLocaleString())}\n\n${gDesc}${smallIconPill('id', 'Server ID')} ${smallPill(g.id)}\n${smallIconPill('calendar', 'Server Created')} ${timestamp(g.createdAt, 'f')}`,
        fields: [],
      });

      if (g.banner || g.splash || g.discoverySplash) {
        inviteCard.image = {
          url: (g.bannerUrl || g.splashUrl || g.discoverySplashUrl) + '?size=4096',
        };

        // TODO: report
        if (g.discoverySplashUrl)
          inviteCard.image.url = inviteCard.image.url.replace('/splashes/', '/discovery-splashes/');
      }

      // Guild Features
      if (g.features.length >= 1) {
        let featureCards = guildFeaturesField(g);

        let pages = [];
        let i = 0;
        let ic = Math.ceil(featureCards.length / 2);

        if (ic === 1) featureCards[0].name = `${icon('list')} Server Features`;
        while (featureCards.length >= 1) {
          i++;
          const sub = featureCards.splice(0, 2);
          sub[0].name = `${icon('list')} Server Features (${i}/${ic})`;

          pages.push(page(JSON.parse(JSON.stringify(Object.assign({ ...inviteCard }, { fields: sub })))));
        }

        await paginator.createPaginator({
          context,
          pages: formatPaginationEmbeds(pages),
        });
        return;
      }

      return editOrReply(context, inviteCard);
    } catch (e) {
      console.log(e);
      return editOrReply(context, createEmbed('error', context, 'Unable to fetch invite link.'));
    }
  },
};
