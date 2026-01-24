const { PERMISSION_GROUPS } = require('#constants');
const { renderMusicButtons } = require('#utils/buttons');
const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { icon } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { URL_REGEX } = require('#utils/urls');

const superagent = require('superagent');

module.exports = {
  name: 'audio',
  aliases: ['aud'],
  metadata: {
    description: `${icon('reply')} __Replying__ to a message while using this command will return a list of music streaming platforms the provided song (link) is available on.`,
    description_short: 'Cross-platform music resolver',
    category: 'utils',
    usage: 'audio',
    slashCommand: 'Music Platforms',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async context => {
    await acknowledge(context);

    try {
      let msg;
      if (!context.message.messageReference) msg = context.message;
      else {
        try {
          msg = await context.message.channel.fetchMessage(context.message.messageReference.messageId);
        } catch {
          return editOrReply(context, createEmbed('error', context, 'Unable to fetch message.'));
        }
      }

      let urls = msg.content.match(URL_REGEX);
      if (msg.messageSnapshots?.length >= 1) urls = msg.messageSnapshots.first().message.content.match(URL_REGEX);
      if (urls) {
        const songlink = await superagent.get(`https://api.song.link/v1-alpha.1/links`).query({
          url: urls[0],
          key: process.env.SONGLINK_KEY,
        });
        const song = songlink.body.entitiesByUniqueId[songlink.body.entityUniqueId];

        // YT Playlist thumbnails don't work properly
        if (
          songlink.body.entityUniqueId.startsWith('YOUTUBE_PLAYLIST') &&
          Object.keys(songlink.body.entitiesByUniqueId).length >= 2
        ) {
          song.thumbnailUrl =
            songlink.body.entitiesByUniqueId[
              Object.keys(songlink.body.entitiesByUniqueId).filter(k => !k.startsWith('YOUTUBE_PLAYLIST'))[0]
            ].thumbnailUrl;
        }

        const btns = renderMusicButtons(songlink.body.linksByPlatform);
        return editOrReply(context, {
          embeds: [
            createEmbed('defaultNoFooter', context, {
              author: {
                name: `${song.title} by ${song.artistName}`.substr(0, 1000),
                iconUrl: song.thumbnailUrl,
                url: urls[0],
              },
            }),
          ],
          components: btns,
        });
      } else {
        return editOrReply(context, createEmbed('warning', context, 'No urls found.'));
      }
    } catch (e) {
      console.log(e);
      return editOrReply(context, createEmbed('warning', context, `No results found.`));
    }
  },
};
