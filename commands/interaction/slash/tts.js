module.exports = {
  description: 'Text to Speech commands',
  name: 'tts',
  options: [
    require('../subcommands/tts/tiktok'),
    require('../subcommands/tts/microsoft'),
    require('../subcommands/tts/moonbase'),
    require('../subcommands/tts/playht'),
    require('../subcommands/tts/imtranslator')
  ]
};