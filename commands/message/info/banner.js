const { paginator } = require('#client');
const { PERMISSION_GROUPS } = require('#constants');

const { createEmbed, page } = require("#utils/embed");
const { acknowledge } = require('#utils/interactions');
const { icon } = require('#utils/markdown');
const { editOrReply } = require("#utils/message");
const { getUser } = require("#utils/users");

module.exports = {
  name: 'banner',
  label: 'user',
  aliases: ['b'],
  metadata: {
    description: 'Displays someones profile banner. Accepts IDs, Mentions, or Usernames.',
    description_short: 'Get discord user avatars',
    examples: ['avatar labsCore'],
    category: 'info',
    usage: 'avatar [<user>]',
    slashCommmand: 'banner'
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    await acknowledge(context);
    
    if(!args.user) args.user = context.userId;
    let u = await getUser(context, args.user)

    if(!u || !u.user) return editOrReply(context, createEmbed("warning", context, "No users found."))

    if(!u.user.banner && !u.user.accentColor && !u.member?.banner) return editOrReply(context, createEmbed("warning", context, "User doesn't have a banner set."))

    let userBanner = u.user.bannerUrl ? u.user.bannerUrl + "?size=4096" : undefined;
    if(!u.user.banner) userBanner = `https://lh3.googleusercontent.com/akBt-2Rz3efGuxAnOoSJbGuaqxZuRAI7ZUYKBgYZLT4vsk34qVWoAm3o6--RxupzZpayLSRsxO1LCwBECyBT_giQ3xhLMR03z7xngvm4m9ZgQ2Gya1i-3Q%3Dw1920-h677-bc0x0055aa-fcrop64%3D1%2C0000000000010001-rj-b36-c0x${u.user.accentColor.toString(16)}-s`;
    let pages = []
    
    if(!u.member?.banner && u.member) u.member = await context.guild.fetchMember(u.user.id)

    if(u.member?.banner) {
      pages.push(page(createEmbed("default", context, {
        image: {
          url: `https://cdn.discordapp.com/guilds/${context.guild.id}/users/${u.member.id}/banners/${u.member.banner}.png` + "?size=4096"
        }
      })))

      if(u.user.bannerUrl) pages.push(page(createEmbed("default", context, {
        image: {
          url: u.user.bannerUrl.includes("?") ? u.user.bannerUrl : u.user.bannerUrl + '?size=4096'
        }
      })))

      await paginator.createPaginator({
        context,
        pages,
        buttons: [{
          customId: "next",
          emoji: icon("button_user_profile_swap"),
          label: "Toggle Server/Global Banner",
          style: 2,
          disabled: pages.length === 1
        }]
      });
    } else {
      return editOrReply(context, createEmbed("default", context, {
        image: {
          url: userBanner
        }
      }))
    }
  },
};