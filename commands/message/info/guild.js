const { paginator } = require('#client');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed, page, formatPaginationEmbeds } = require('#utils/embed');
const { guildFeaturesField } = require('#utils/fields');
const { getGuildIcon } = require('#utils/guilds');
const { acknowledge } = require('#utils/interactions');
const { icon, timestamp, codeblock, smallIconPill, smallPill } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');

module.exports = {
  name: 'server',
  label: 'user',
  aliases: ['guild', 'guildinfo', 'serverinfo'],
  metadata: {
    description: 'Displays information about the server.',
    description_short: 'Information about the server',
    category: 'info',
    usage: 'server',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async context => {
    await acknowledge(context);

    try {
      const emojis = context.message.guild.emojis;

      const channels = context.message.guild.channels;

      const categoryChannels = channels.filter(channel => channel.isGuildCategory).length;
      const newsChannels = channels.filter(channel => channel.isGuildNews).length;
      const textChannels = channels.filter(channel => channel.isGuildText).length;
      const voiceChannels = channels.filter(channel => channel.isGuildVoice).length;
      const stageChannels = channels.filter(channel => channel.isGuildStageVoice).length;
      const forumChannels = channels.filter(channel => channel.isGuildForum).length;

      const g = context.guild;
      // Guild Card

      // Header Pills
      const pills = [];
      pills.push(smallIconPill('user_multiple', context.guild.memberCount + ' Members'));
      if (g.premiumSubscriptionCount >= 1) pills.push(smallIconPill('boost', g.premiumSubscriptionCount + ' Boosts'));
      if (g.roles.length >= 2) pills.push(smallIconPill('user_shield', `${g.roles.length} Roles`));
      if (emojis.length >= 1) pills.push(smallIconPill('emoji', emojis.length + ' Emoji'));
      if (channels.length >= 1) pills.push(smallIconPill('channel', g.channels.length + ' Channels'));
      if (g.owner) pills.push(`${icon('user_king')} <@${g.owner.id}>`);

      let pillDisplay = '';
      for (let i = 0; i < pills.length; i++) {
        const element = pills[i];
        pillDisplay += element + ' ';
        if (!((i + 1) % 2)) pillDisplay += '\n';
      }

      const guildCard = createEmbed('default', context, {
        author: {
          name: g.name,
          iconUrl: getGuildIcon(g),
        },
        description: `${pillDisplay}\n\n${smallIconPill('id', 'Server ID')} ${smallPill(g.id)}\n${smallIconPill('calendar', 'Server Created')} ${timestamp(g.createdAt, 'f')}`,
        fields: [],
      });

      // Channel Container
      const lines = [];
      if (textChannels >= 1) lines.push(`Text Channels          ${textChannels}`);
      if (forumChannels >= 1) lines.push(`Forum Channels         ${forumChannels}`);
      if (newsChannels >= 1) lines.push(`Announcement Channels  ${newsChannels}`);
      if (voiceChannels >= 1) lines.push(`Voice Channels         ${voiceChannels}`);
      if (stageChannels >= 1) lines.push(`Stage Channels         ${stageChannels}`);
      if (categoryChannels >= 1) lines.push(`Categories             ${categoryChannels}`);

      guildCard.fields.push({
        name: `${icon('channel')} Channels`,
        value: codeblock('py', lines),
        inline: false,
      });

      if (g.banner || g.splash || g.discoverySplash) {
        guildCard.image = {
          url: (g.bannerUrl || g.splashUrl || g.discoverySplashUrl) + '?size=4096',
        };

        // TODO: report
        if (g.discoverySplashUrl)
          guildCard.image.url = guildCard.image.url.replace('/splashes/', '/discovery-splashes/');
      }

      console.log(g.banner || g.splash || g.discoverySplash);

      // Guild Features
      if (g.features.length >= 1) {
        const featureCards = guildFeaturesField(g);

        const pages = [];
        let i = 0;
        const ic = Math.ceil(featureCards.length / 2);

        if (ic === 1) featureCards[0].name = `${icon('list')} Server Features`;
        while (featureCards.length >= 1) {
          i++;
          const sub = featureCards.splice(0, 2);
          sub[0].name = `${icon('list')} Server Features (${i}/${ic})`;

          pages.push(page(JSON.parse(JSON.stringify({ ...guildCard, fields: [...guildCard.fields, ...sub] }))));
        }

        await paginator.createPaginator({
          context,
          pages: formatPaginationEmbeds(pages),
        });
        return;
      }

      return editOrReply(context, guildCard);
    } catch (e) {
      console.log(e);
    }
  },
};
