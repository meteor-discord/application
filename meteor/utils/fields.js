const { GUILD_FEATURES, GUILD_FEATURE_ICONS_REDESIGN } = require('../constants');

module.exports.guildFeaturesField = function (g) {
  const featureCards = [];
  let fN = [];
  const fD = {};

  for (const feat of g.features.toArray()) {
    if (GUILD_FEATURES[feat]) {
      let n = feat
        .replace(/_/g, ' ')
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      if (GUILD_FEATURES[feat].label) n = GUILD_FEATURES[feat].label;

      fN.push(n);
      fD[n] = GUILD_FEATURES[feat].icon;
    } else {
      fN.push(feat);
    }
  }

  fN = fN.sort((a, b) => a.normalize().localeCompare(b.normalize()));
  while (fN.length) {
    sfN = fN.splice(0, 10);
    const ft = [];
    for (const f of sfN) {
      let ic = fD[f];
      if (!fD[f]) ic = GUILD_FEATURE_ICONS_REDESIGN.CircleQuestionIcon;

      // Clean up icon to save on characters
      ft.push(
        `${ic.replace(/:[a-z1-9_]*:/, ':i:')} ${f
          .split('_')
          .map(i => i.substring(0, 1).toUpperCase() + i.substring(1, i.length).toLowerCase())
          .join(' ')}`
      );
    }
    featureCards.push({
      name: `​`,
      value: ft.join('\n'),
      inline: true,
    });
  }

  return featureCards;
};
