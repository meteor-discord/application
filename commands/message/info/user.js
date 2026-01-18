const { paginator } = require('#client');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { icon, highlight, timestamp, smallIconPill, smallPill } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { getUser, renderBadges, getUserAvatar } = require('#utils/users');

const { UserFlags } = require('detritus-client/lib/constants');

module.exports = {
  name: 'user',
  label: 'user',
  aliases: ['u', 'profile', 'userinfo', 'ui'],
  metadata: {
    description: 'Displays information about a discord user. Accepts IDs, Mentions and Usernames.',
    description_short: 'Information about discord users',
    examples: ['user meteor'],
    category: 'info',
    usage: 'user [<user>]',
    slashCommand: 'user',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    await acknowledge(context);

    try {
      let u;
      if (!args.user) {
        args.user = context.user.id;
      }

      if (args.user == '456226577798135808')
        return editOrReply(context, createEmbed('error', context, 'This user has been deleted.'));

      user = await getUser(context, args.user);
      u = user.user;
      if (!u) return editOrReply(context, createEmbed('warning', context, 'No users found.'));
      let m = user.member;

      // User Card

      let usernameDisplay = u.name;
      if (u.discriminator && u.discriminator !== '0') usernameDisplay += `#${u.discriminator}`;
      else usernameDisplay = '@' + usernameDisplay;

      let cardContent = '';

      // Badge Container
      let b = renderBadges(u);
      if (b.length >= 1) cardContent += `\n-# ${b.join('')}\n`;

      cardContent += `\n${smallIconPill('id', 'User ID')} ${smallPill(u.id)}`;
      if (u.globalName !== null)
        cardContent += `\n${smallIconPill('user_card', 'Display Name')} ${smallPill(u.globalName)}`;
      if (m && m.nick !== null) cardContent += `\n${smallIconPill('user_card', 'Nickname')} ${smallPill(m.nick)}`;
      if (u.accentColor)
        cardContent += `\n${smallIconPill('pencil', 'Accent Color')} ${smallPill(`#${u.accentColor.toString(16)}`)}`;
      if (u.clan && u.clan.tag !== null) cardContent += `\n${smallIconPill('shield', 'Tag')} ${smallPill(u.clan.tag)}`;

      if (u.hasFlag(1 << 23)) cardContent += `\n-# Provisional Account`;

      let userCard = createEmbed('default', context, {
        author: {
          name: usernameDisplay,
          iconUrl: getUserAvatar(u),
          url: `https://discord.com/users/${u.id}`,
        },
        color: u.accentColor,
        description: `${cardContent}`,
        fields: [
          {
            name: `${icon('calendar')} Dates`,
            value: `**Account Created: **${timestamp(u.createdAt, 'f')}`,
            inline: false,
          },
        ],
      });
      if (u.banner && u.bannerUrl) userCard.image = { url: u.bannerUrl + `?size=4096` };

      // Guild Container
      if (m) {
        userCard.fields[0].value = userCard.fields[0].value + `\n**Joined Server: **${timestamp(m.joinedAt, 'f')}`;
        let guildFields = [];

        if (m.isOwner) guildFields.push(`${icon('user_king')} **Server Owner**`);
        if (m.roles.length >= 1) guildFields.push(`**Roles: ** ${m.roles.length}/${context.guild.roles.length}`);
        if (m.premiumSince) guildFields.push(`**Boosting since: ** ${timestamp(m.premiumSince, 'f')}`);
        userCard.fields.push({
          name: `${icon('home')} Server`,
          value: guildFields.join('\n'),
          inline: true,
        });
      }

      if (!m?.banner && m) u.member = await context.guild.fetchMember(u.id);

      // No special handling
      if (m == undefined || (m.avatar === null && m.banner === null)) return editOrReply(context, userCard);

      let pages = [];

      let memberCard = structuredClone(userCard);
      if (m?.avatar !== null) memberCard.thumbnail = { url: m.avatarUrl + '?size=4096' };
      if (m?.banner !== null)
        memberCard.image = {
          url:
            `https://cdn.discordapp.com/guilds/${context.guild.id}/users/${m.id}/banners/${m.banner}.png` +
            '?size=4096',
        };

      // Show the server-specific card first if available
      pages.push(page(memberCard));
      pages.push(page(userCard));

      await paginator.createPaginator({
        context,
        pages,
        buttons: [
          {
            customId: 'next',
            emoji: icon('button_user_profile_swap'),
            label: 'Toggle Server/Global Profile',
            style: 2,
          },
        ],
      });
    } catch (e) {
      console.log(e);
      return editOrReply(context, createEmbed('error', context, 'Unable to display user info.'));
    }
  },
};
