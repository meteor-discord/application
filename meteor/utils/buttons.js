const { MUSIC_PLATFORM_ICONS } = require('#constants');

module.exports.renderMusicButtons = function (platforms) {
  const btns = [];
  for (const k of Object.keys(platforms)) {
    const s = platforms[k];
    if (MUSIC_PLATFORM_ICONS[k]) {
      btns.push({
        custom_id: k.toLowerCase(),
        style: 5,
        url: s.url,
        emoji: { id: MUSIC_PLATFORM_ICONS[k] },
        type: 2,
      });
    }
  }
  const rows = [];
  while (btns.length) {
    rows.push(btns.splice(0, 5));
  }
  const components = [];
  for (const r of rows) {
    components.push({
      components: r,
      type: 1,
    });
  }
  return components;
};
