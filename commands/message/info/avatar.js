const { paginator } = require('#client');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { icon } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { getUser, getUserAvatar } = require('#utils/users');

module.exports = {
  name: 'avatar',
  label: 'user',
  aliases: ['a', 'pfp', 'av'],
  metadata: {
    description: 'Displays someones discord avatar. Accepts IDs, Mentions, or Usernames.',
    description_short: 'Get discord user avatars',
    examples: ['avatar meteor'],
    category: 'info',
    usage: 'avatar [<user>]',
    slashCommmand: 'avatar',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    await acknowledge(context);

    if (!args.user) args.user = context.userId;
    let u = await getUser(context, args.user);
    if (!u || !u.user) return editOrReply(context, createEmbed('warning', context, 'No users found.'));

    if (u.member && u.member.avatar !== null) {
      let pages = [];
      pages.push(
        page(
          createEmbed('default', context, {
            image: {
              url: u.member.avatarUrl + '?size=4096',
            },
          })
        )
      );

      pages.push(
        page(
          createEmbed('default', context, {
            image: {
              url: getUserAvatar(u.user),
            },
          })
        )
      );

      await paginator.createPaginator({
        context,
        pages,
        buttons: [
          {
            customId: 'next',
            emoji: icon('button_user_profile_swap'),
            label: 'Toggle Server/Global Avatar',
            style: 2,
          },
        ],
      });
    } else {
      return editOrReply(
        context,
        createEmbed('default', context, {
          image: {
            url: getUserAvatar(u.user),
          },
        })
      );
    }
  },
};
