const { PERMISSION_GROUPS } = require('#constants');
const { renderMusicButtons } = require('#utils/buttons');
const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { editOrReply } = require('#utils/message');

const { ApplicationCommandTypes, InteractionContextTypes, ApplicationIntegrationTypes } = require("detritus-client/lib/constants");

const superagent = require('superagent')

const urlr = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/g

module.exports = {
  name: 'Music Platforms',
  type: ApplicationCommandTypes.MESSAGE,
  contexts: [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.PRIVATE_CHANNEL,
    InteractionContextTypes.BOT_DM
  ],
  integrationTypes: [
    ApplicationIntegrationTypes.USER_INSTALL
  ],
  run: async (context, args) => {
    try{
      await acknowledge(context, false, [...PERMISSION_GROUPS.baseline_slash]);

      const { message } = args;

      let urls = message.content.match(urlr)
      if(message.messageSnapshots?.length >= 1) urls = message.messageSnapshots.first().message.content.match(urlr);
      if(urls){
        try{
          let songlink = await superagent.get(`https://api.song.link/v1-alpha.1/links`)
            .query({
              url: urls[0],
              key: process.env.SONGLINK_KEY
            })
          let song = songlink.body.entitiesByUniqueId[songlink.body.entityUniqueId]

          // YT Playlist thumbnails don't work properly
          if(songlink.body.entityUniqueId.startsWith("YOUTUBE_PLAYLIST") && Object.keys(songlink.body.entitiesByUniqueId).length >= 2){
            song.thumbnailUrl = songlink.body.entitiesByUniqueId[Object.keys(songlink.body.entitiesByUniqueId).filter((k)=>!k.startsWith("YOUTUBE_PLAYLIST"))[0]].thumbnailUrl
          }
  
          let btns = renderMusicButtons(songlink.body.linksByPlatform)
          return editOrReply(context, {embeds:[
            createEmbed("defaultNoFooter", context, {
              author: {
                name: `${song.title} by ${song.artistName}`.substr(0,1000),
                iconUrl: song.thumbnailUrl,
                url: urls[0]
              }
            })
          ], components: btns })
        }catch(e){
          return editOrReply(context, createEmbed("warning", context, "No results found."))
        }
      } else {
        return editOrReply(context, createEmbed("warning", context, "No urls found."))
      }
    }catch(e){
      console.log(e)
      await editOrReply(context, createEmbed("error", context, "Unable to look up song url."))
    }
  },
};