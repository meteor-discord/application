const { COLORS, MESSAGE_BLOCK_REASONS } = require('#constants');
const { icon, link } = require('./markdown');

function applyIncognitoNotice(message, reasonKey, metadata) {
  const reason = MESSAGE_BLOCK_REASONS[reasonKey];
  if (!reason) return;

  if (message.content) {
    if (message.embeds && message.embeds.length <= 4) {
      message.embeds.unshift({
        description: `${icon('flask_incognito')} This response has been made incognito due to ${reason.message}.`,
        color: COLORS.incognito,
      });
    }
    return;
  }

  message.content = `-# ${icon('flask_mini')} This response has been made incognito due to ${reason.message} • ${link('https://support.discord.com/hc/en-us/articles/' + reason.support_article, 'Learn More', 'Support Article')}${metadata ? ' • ' + link(metadata, 'View Missing Permissions', 'View Missing Permissions', false) : ''}`;
}

module.exports.applyIncognitoNotice = applyIncognitoNotice;
