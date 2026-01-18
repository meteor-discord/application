const { BADGE_ICONS } = require('#constants');

const { createEmbed } = require('#utils/embed');
const { smallIconPill, highlight, smallPill, icon, timestamp } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { renderBadges, getUserAvatar } = require('#utils/users');

const { PERMISSION_GROUPS } = require('#constants');
const { acknowledge } = require('#utils/interactions');

const { InteractionCallbackTypes, ApplicationCommandTypes, UserFlags } = require('detritus-client/lib/constants');

module.exports = {
  name: 'View User Details',
  type: ApplicationCommandTypes.USER,
  contexts: [
    0,
    1,
    2
  ],
  integrationTypes: [
    1
  ],
  run: async (context, args) => {
    try{
      await acknowledge(context, false, [...PERMISSION_GROUPS.baseline_slash]);

      const { user, member } = args;
  
      let u = await context.client.rest.fetchUser(user.id);;
      let m = member;
  
      let usernameDisplay = u.name
      if(u.discriminator && u.discriminator !== "0") usernameDisplay += `#${u.discriminator}`
      else usernameDisplay = "@" + usernameDisplay;

      let cardContent = "";

      // Badge Container
      let b = renderBadges(u)
      if(b.length >= 1) cardContent += `\n-# ${b.join('')}\n`

      console.log(u)

      cardContent += `\n${smallIconPill("id", "User ID")} ${smallPill(u.id)}`;
      if(u.globalName !== null) cardContent += `\n${smallIconPill("user_card", "Display Name")} ${smallPill(u.globalName)}`
      if(m && m.nick !== null) cardContent += `\n${smallIconPill("user_card", "Nickname")} ${smallPill(m.nick)}`
      if (u.accentColor) cardContent += `\n${smallIconPill("pencil", "Accent Color")} ${smallPill(`#${u.accentColor.toString(16)}`)}`
      if (u.clan && u.clan.tag !== null) cardContent += `\n${smallIconPill("shield", "Clan")} ${smallPill(u.clan.tag)}`

      if(u.hasFlag(1<<23)) cardContent += `\n-# Provisional Account`

      let userCard = createEmbed("default", context, {
        author: {
          name: usernameDisplay,
          iconUrl: getUserAvatar(u),
          url: `https://discord.com/users/${u.id}`
        },
        color: u.accentColor,
        description: `${cardContent}`,
        fields: [{
          name: `${icon("calendar")} Dates`,
          value: `**Account Created: **${timestamp(u.createdAt, "f")}`,
          inline: false
        }]
      })
      if (u.banner && u.bannerUrl) userCard.image = { url: u.bannerUrl + `?size=4096` }
  
      // Guild Container
      if (m) {
        userCard.fields[0].value = userCard.fields[0].value + `\n**Joined Server: **${timestamp(m.joinedAt, "f")}`
        let guildFields = []
  
        if (m.isOwner) guildFields.push(`${icon("user_king")} **Server Owner**`)
        if(context.guild) if (m.roles.length >= 1) guildFields.push(`${icon("user_shield")} **Roles: ** ${m.roles.length}/${context.guild?.roles.length}`)
        if (m.premiumSince) guildFields.push(`**Boosting since: ** ${timestamp(m.premiumSince, 'f')}`)
        if(guildFields.length >= 1) userCard.fields.push({
          name: `${icon("home")} Server`,
          value: guildFields.join('\n'),
          inline: true
        })
      }
  
      return editOrReply(context, userCard)
    }catch(e){
      console.log(e)
      return editOrReply(context, createEmbed("error", context, "Unable to display user info."))
    }
  },
};