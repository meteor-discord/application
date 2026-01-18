
const { Permissions } = require("detritus-client/lib/constants")

module.exports.PERMISSIONS_TEXT = Object.freeze({
  [Permissions.ADD_REACTIONS]: "Add Reactions",
  [Permissions.ADMINISTRATOR]: "Administrator",
  [Permissions.ATTACH_FILES]: "Attach Files",
  [Permissions.BAN_MEMBERS]: "Ban Members",
  [Permissions.CHANGE_NICKNAME]: "Change Nickname",
  [Permissions.CHANGE_NICKNAMES]: "Manage Nicknames",
  [Permissions.CONNECT]: "Connect",
  [Permissions.CREATE_INSTANT_INVITE]: "Create Invites",
  [Permissions.DEAFEN_MEMBERS]: "Deafen Members",
  [Permissions.EMBED_LINKS]: "Embed Links",
  [Permissions.KICK_MEMBERS]: "Kick Members",
  [Permissions.MANAGE_CHANNELS]: "Manage Channels",
  [1 << 30]: "Manage Expressions", // 
  [Permissions.MANAGE_GUILD]: "Manage Server",
  [Permissions.MANAGE_MESSAGES]: "Manage Messages",
  [Permissions.MANAGE_ROLES]: "Manage Roles",
  [Permissions.MANAGE_WEBHOOKS]: "Manage Webhooks",
  [Permissions.MENTION_EVERYONE]: "Mention Everyone",
  [Permissions.MOVE_MEMBERS]: "Move Members",
  [Permissions.MUTE_MEMBERS]: "Mute Members",
  [Permissions.NONE]: "None",
  [Permissions.PRIORITY_SPEAKER]: "Priority Speaker",
  [Permissions.READ_MESSAGE_HISTORY]: "Read Message History",
  [Permissions.SEND_MESSAGES]: "Send Messages",
  [Permissions.SEND_TTS_MESSAGES]: "Text-To-Speech",
  [Permissions.SPEAK]: "Speak",
  [Permissions.STREAM]: "Video",
  [Permissions.USE_EXTERNAL_EMOJIS]: "Use External Emojis",
  [Permissions.USE_VAD]: "Voice Auto Detect",
  [Permissions.VIEW_AUDIT_LOG]: "View Audit Logs",
  [Permissions.VIEW_CHANNEL]: "View Channel",
  [Permissions.VIEW_GUILD_ANALYTICS]: "View Server Insights",  
  [Permissions.MANAGE_EVENTS]: "Manage Events",
  [Permissions.MANAGE_THREADS]: "Manage Threads",
  [Permissions.REQUEST_TO_SPEAK]: "Request to Speak",
  [Permissions.SEND_MESSAGES_IN_THREADS]: "Send Messages in Threads",
  [Permissions.USE_APPLICATION_COMMANDS]: "Use Application Commands",
  [Permissions.USE_EXTERNAL_STICKERS]: "Use External Stickers",
  [Permissions.USE_PRIVATE_THREADS]: "Create Private Threads",
  [Permissions.USE_PUBLIC_THREADS]: "Create Public Threads",
  [1n << 39n]: "Use Activities",
  [1n << 40n]: "Time out members",
  [1n << 41n]: "View Server Subscription Insights",
  [1n << 42n]: "Use Soundboard",
  [1n << 43n]: "Create Expressions",
  [1n << 44n]: "Create Events",
  [1n << 45n]: "Use External Sounds",
  [1n << 46n]: "Send Voice Messages",
  [1n << 47n]: "Use Clyde AI",
  [1n << 48n]: "Set Voice Channel Status",
  [1n << 49n]: "Create Polls",
  [1n << 50n]: "Use External Apps"
});

module.exports.PERMISSION_CATEGORIES = Object.freeze({
  GENERAL_SERVER: [
    Permissions.VIEW_CHANNEL,
    Permissions.MANAGE_CHANNELS,
    Permissions.MANAGE_ROLES,
    Permissions.MANAGE_EMOJIS,
    1n << 43n, // Create expressions
    Permissions.VIEW_AUDIT_LOG,
    Permissions.VIEW_GUILD_ANALYTICS,
    1n << 41n, // View subscription analytics
    Permissions.MANAGE_WEBHOOKS,
    Permissions.MANAGE_GUILD
  ],
  MEMBERSHIP_PERMISSIONS: [
    Permissions.CREATE_INSTANT_INVITE,
    Permissions.CHANGE_NICKNAME,
    Permissions.CHANGE_NICKNAMES,
    Permissions.KICK_MEMBERS,
    Permissions.BAN_MEMBERS,
    1n << 40n // Time out members
  ],
  TEXT_CHANNEL_PERMISSIONS: [
    Permissions.SEND_MESSAGES,
    Permissions.SEND_MESSAGES_IN_THREADS,
    Permissions.USE_PUBLIC_THREADS,
    Permissions.USE_PRIVATE_THREADS,
    Permissions.EMBED_LINKS,
    Permissions.ATTACH_FILES,
    Permissions.ADD_REACTIONS,
    Permissions.USE_EXTERNAL_EMOJIS,
    Permissions.USE_EXTERNAL_STICKERS,
    Permissions.MENTION_EVERYONE,
    Permissions.MANAGE_MESSAGES,
    Permissions.MANAGE_THREADS,
    Permissions.READ_MESSAGE_HISTORY,
    Permissions.SEND_TTS_MESSAGES,
    1n << 46n, // Send Voice Messages
    1n << 49n // Create Polls
  ],
  VOICE_CHANNEL_PERMISSIONS: [
    Permissions.CONNECT,
    Permissions.SPEAK,
    Permissions.STREAM,
    1n << 42n, // Use soundboard
    1n << 45n, // Use external sounds
    Permissions.USE_VAD,
    Permissions.PRIORITY_SPEAKER,
    Permissions.MUTE_MEMBERS,
    Permissions.DEAFEN_MEMBERS,
    Permissions.MOVE_MEMBERS,
    1n << 48n // Set voice channel status
  ],
  APPS_PERMISSIONS: [
    Permissions.USE_APPLICATION_COMMANDS,
    1n << 39n, // Use Activities
    1n << 50n // Use External Apps
  ],
  STAGE_CHANNEL_PERMISSIONS: [
    Permissions.REQUEST_TO_SPEAK
  ],
  EVENTS_PERMISSIONS: [
    1n << 44n, // Create Events
    Permissions.MANAGE_EVENTS
  ],
  ADVANCED_PERMISSIONS: [
    Permissions.ADMINISTRATOR
  ]
})