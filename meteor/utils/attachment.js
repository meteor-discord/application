const attachmentTypes = Object.freeze({
  image: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
});

module.exports.attachmentTypes = attachmentTypes;

// Returns the first attachment from a message (if it exists)
function getMessageAttachment(message) {
  if (message.messageSnapshots && message.messageSnapshots.length >= 1)
    message = message.messageSnapshots.first().message;

  if (message.attachments.first()) {
    return message.attachments.first();
  } else if (message.embeds.length && message.embeds.toArray()[0].image) {
    return message.embeds.toArray()[0].image;
  } else if (message.embeds.length && message.embeds.toArray()[0].thumbnail) {
    return message.embeds.toArray()[0].thumbnail;
  }
  return;
}

module.exports.getMessageAttachment = getMessageAttachment;

async function getRecentMedia(context, limit) {
  if (!context.message.channel) {
    return undefined;
  } else if (context.message.attachments.length > 0) {
    return [context.message.attachments.first()];
  }

  let messages = [];

  // Handle Replies
  if (context.message.messageReference) {
    const ref = await context.message.channel.fetchMessage(context.message.messageReference.messageId);
    if (ref.stickerItems.length && ref.stickerItems.first().formatType !== 3)
      return [
        {
          url: `https://media.discordapp.net/stickers/${ref.stickerItems.first().id}.png?size=4096`,
          contentType: 'image/png',
        },
      ];
    messages = [[context.message.messageReference.messageId, ref]]; // somewhat hacky but it works lol
  } else {
    messages = await context.message.channel.fetchMessages({
      limit,
      before: context.message.id,
    });
  }

  if (!messages) {
    return undefined;
  }

  const attachments = [];
  for (const m of messages) {
    const a = getMessageAttachment(m[1]);
    if (a) attachments.push(a);
  }
  return attachments;
}

module.exports.getRecentVideo = async function (context, limit) {
  if (!context.message.channel) {
    return undefined;
  }

  // Handle Replies
  if (context.message.messageReference) {
    messages = [
      [
        context.message.messageReference.messageId,
        await context.message.channel.fetchMessage(context.message.messageReference.messageId),
      ],
    ]; // somewhat hacky but it works lol
  } else {
    messages = await context.message.channel.fetchMessages({
      limit,
      before: context.message.id,
    });
  }

  if (!messages) {
    return undefined;
  }

  const attachments = [];
  for (const m of messages) {
    const message = m[1];
    if (
      // Then the embed image
      message.embeds.length > 0 &&
      message.embeds.toArray()[0].video
    ) {
      attachments.push(message.embeds.toArray()[0].video);
    } else if (message.attachments.first() && message.attachments.first().contentType?.includes('video')) {
      attachments.push(message.attachments.first());
    }
  }
  return attachments;
};

function validateAttachment(attachment, type) {
  const allowedTypes = attachmentTypes[type];
  if (attachment.contentType && allowedTypes.includes(attachment.contentType)) {
    // discord attachment
    return true;
  } else if (!attachment.contentType) {
    // other form of media
    return true;
  } else {
    return false;
  }
}

module.exports.validateAttachment = validateAttachment;

module.exports.getRecentImage = async function (context, limit) {
  const attachments = await getRecentMedia(context, limit);

  let at;
  for (const a of attachments) {
    if (validateAttachment(a, 'image') && at === undefined) at = a.url;
  }
  return at;
};
