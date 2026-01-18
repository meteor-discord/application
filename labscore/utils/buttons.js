const { MUSIC_PLATFORM_ICONS } = require("#constants");

module.exports.renderMusicButtons = function(platforms){
  let btns = [];
  for(const k of Object.keys(platforms)){
    let s = platforms[k]
    if(MUSIC_PLATFORM_ICONS[k]){
      btns.push(
        {
          custom_id: k.toLowerCase(),
          style: 5,
          url: s.url,
          emoji: { id: MUSIC_PLATFORM_ICONS[k]},
          type: 2
        }
      )
    }
  }
  let rows = []
  while(btns.length){
    rows.push(btns.splice(0, 5))
  }
  let components = []
  for(const r of rows){
    components.push(
      {
        components: r,
        type: 1,
      }
    )
  }
  return components
}