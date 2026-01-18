const { paginator } = require('#client');
const { PERMISSION_GROUPS } = require('#constants');
const { PERMISSION_CATEGORIES, PERMISSIONS_TEXT } = require('#permissions');

const { createEmbed, page, formatPaginationEmbeds } = require("#utils/embed");
const { acknowledge } = require('#utils/interactions');
const { icon, iconPill, smallPill, pill } = require("#utils/markdown");
const { editOrReply } = require("#utils/message");

const { PermissionTools } = require('detritus-client/lib/utils');

// TODO: Move this to a utility module
function toCodePoint(unicodeSurrogates, sep) {
  var
    r = [],
    c = 0,
    p = 0,
    i = 0;
  while (i < unicodeSurrogates.length) {
    c = unicodeSurrogates.charCodeAt(i++);
    if (p) {
      r.push((0x10000 + ((p - 0xD800) << 10) + (c - 0xDC00)).toString(16));
      p = 0;
    } else if (0xD800 <= c && c <= 0xDBFF) {
      p = c;
    } else {
      r.push(c.toString(16));
    }
  }
  return r.join(sep || '-');
}

const DEFAULT_ROLE_COLOR = "99AAB5"

const PERMISSION_CATEGORY = [
  [
    {
      label: "General Server Permissions",
      icon: "home",
      permissions: PERMISSION_CATEGORIES.GENERAL_SERVER
    }
  ],
  [
    {
      label: "Membership Permissions",
      icon: "shield",
      permissions: PERMISSION_CATEGORIES.MEMBERSHIP_PERMISSIONS
    }
  ],
  [
    {
      label: "Text Channel Permissions",
      icon: "channel",
      permissions: PERMISSION_CATEGORIES.TEXT_CHANNEL_PERMISSIONS
    }
  ],
  [
    {
      label: "Voice Channel Permissions",
      icon: "audio",
      permissions: PERMISSION_CATEGORIES.VOICE_CHANNEL_PERMISSIONS
    },
    {
      label: "Apps Permissions",
      icon: "apps",
      permissions: PERMISSION_CATEGORIES.APPS_PERMISSIONS
    }
  ],
  [
    {
      label: "Events Permissions",
      icon: "calendar",
      permissions: PERMISSION_CATEGORIES.EVENTS_PERMISSIONS
    },
    {
      label: "Stage Channel Permissions",
      icon: "stage",
      permissions: PERMISSION_CATEGORIES.STAGE_CHANNEL_PERMISSIONS
    },
    {
      label: "Advanced Permissions",
      icon: "shield",
      permissions: PERMISSION_CATEGORIES.ADVANCED_PERMISSIONS
    }
  ]
]

module.exports = {
  name: 'role',
  label: 'query',
  aliases: ['roleinfo'],
  metadata: {
    description: 'Displays information about a role in the server.',
    description_short: 'Information about roles',
    category: 'info',
    usage: 'role <name|id>'
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    await acknowledge(context);
    
    let r = context.guild.roles.filter((r)=>r.name.toLowerCase().includes(args.query.toLowerCase()) || r.id == args.query)[0]

    if(!r) return await editOrReply(context, createEmbed("warning", context, "No roles matched your query."))

    let pages = [];

    let rolePage = createEmbed("default", context, {
      author: {
        name: r.name
      },
      description: `${smallPill("ID       ")} ${pill(r.id)}\n${smallPill("Position ")} ${pill(`${context.guild.roles.length - r.position}/${context.guild.roles.length}`)}\n${smallPill("Hoisted  ")} ${pill(`${r.hoist}`)}`
    })

    if(!r.name.startsWith("@") && r.mentionable) rolePage.author.name = "@" + r.name;
    if(r.color === 0) rolePage.author.iconUrl = `https://lh3.googleusercontent.com/akBt-2Rz3efGuxAnOoSJbGuaqxZuRAI7ZUYKBgYZLT4vsk34qVWoAm3o6--RxupzZpayLSRsxO1LCwBECyBT_giQ3xhLMR03z7xngvm4m9ZgQ2Gya1i-3Q=w256-h256-bc0x0055aa-fcrop64=1,0000000000010001-rj-b36-c0x${DEFAULT_ROLE_COLOR}`
    else {
      rolePage.description += `\n${smallPill("Color    ")} ${pill("#" + r.color.toString(16))}`
      rolePage.author.iconUrl = `https://lh3.googleusercontent.com/akBt-2Rz3efGuxAnOoSJbGuaqxZuRAI7ZUYKBgYZLT4vsk34qVWoAm3o6--RxupzZpayLSRsxO1LCwBECyBT_giQ3xhLMR03z7xngvm4m9ZgQ2Gya1i-3Q=w256-h256-bc0x0055aa-fcrop64=1,0000000000010001-rj-b36-c0x${r.color.toString(16)}`
    }

    if(r.unicode_emoji){
      rolePage.thumbnail = {
        url: `https://raw.githubusercontent.com/jdecked/twemoji/main/assets/72x72/${toCodePoint(r.unicode_emoji)}.png`
      }
    } else if(r.icon){
      rolePage.thumbnail = {
        url: r.iconUrl
      }
    }

    let permSection;
    // Render Permissions
    for(const c of PERMISSION_CATEGORY){
      permSection = [];
      for(const section of c){
        let sectionRender = `${iconPill(section.icon, section.label)}\n`
        let permissionsRender = []
        for(const p of section.permissions){
          permissionsRender.push(`${PermissionTools.checkPermissions(r.permissions, p) ? icon("success_simple") : icon("failiure_simple")} ${PERMISSIONS_TEXT[p]}`)
        }
        permSection.push(sectionRender + permissionsRender.join("\n"))
      }

      let newPage = structuredClone(rolePage)
      newPage.description += "\n\n" + permSection.join('\n\n');

      pages.push(page(newPage))
    }
  
    await paginator.createPaginator({
      context,
      pages: formatPaginationEmbeds(pages)
    });
  },
};