const { ApplicationCommandOptionTypes } = require('detritus-client/lib/constants');

module.exports = {
  description: 'TikTok Voices',
  name: 'tiktok',
  type: ApplicationCommandOptionTypes.SUB_COMMAND_GROUP,
  options: [
    require('./tiktok/character'),
    require('./tiktok/pop-culture'),
    require('./tiktok/song'),
    require('./tiktok/french'),
    require('./tiktok/japanese'),
    require('./tiktok/german'),
    require('./tiktok/spanish'),
    require('./tiktok/italian'),
    require('./tiktok/korean'),
    require('./tiktok/portugese'),
    require('./tiktok/indonesian')
  ]
};