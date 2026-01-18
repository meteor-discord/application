const EventEmitter = require('eventemitter3');
const { Context } = require('detritus-client/lib/command');
const { editOrReply } = require('#utils/message');
const { MessageFlags } = require('detritus-client/lib/constants');

module.exports = class BasePaginator extends EventEmitter {
  constructor(client, data) {
    super();
    this.client = client;
    this.data = data;
    this.message = BasePaginator.asMessage(data.context);
    this.commandMessage = data.commandMessage || null;
    this.pages = data.pages;
    this.index = data.index || 0;
    this.ephemeral = data.ephemeral || false;

    this.context = data.context;

    this.targetUser = data.targetUser || this.message?.author?.id || data.context?.user?.id;

    this.disableCloning = data.disableCloning || false;

    this.isInteractionPaginator = false;
    this.editOrReply;
    if (data.context.editOrReply) this.editOrReply = editOrReply.bind(data.context);
    if (data.context.editOrRespond) {
      this.editOrReply = editOrReply.bind(data.context);
      this.isInteractionPaginator = true;
    }
  }

  static asMessage(ctx) {
    return ctx instanceof Context ? ctx.message : ctx;
  }

  get isShared() {
    return this.commandMessage instanceof Map;
  }

  isCommandMessage(messageId) {
    if (!this.commandMessage) return false;

    return this.isShared ? this.commandMessage.has(messageId) : this.commandMessage.id === messageId;
  }

  isInChannel(channelId) {
    if (!this.commandMessage) return false;

    return this.isShared
      ? Array.from(this.commandMessage.values()).some(x => x.channelId === channelId)
      : this.commandMessage.channelId === channelId;
  }

  isTarget(user) {
    return this.targetUser instanceof Set ? this.targetUser.has(user) : this.targetUser === user;
  }

  async update(data) {
    if (this.isInteractionPaginator) return;
    if (this.isShared) {
      for (const m of this.commandMessage.values()) {
        if (!m.deleted) await m.edit(data);
      }
    } else if (this.commandMessage) {
      if (!this.commandMessage.deleted) this.commandMessage.edit(data).catch(e => {});
    }
  }

  async init() {
    // Create Components
    const msg = this.pages[this.index];
    msg.components = await this.client.components(this);

    // Ensure there are no mentions
    if (!msg.message_reference) msg.reference = true;
    if (!msg.allowedMentions) msg.allowedMentions = { parse: [], repliedUser: false };

    if (this.ephemeral) {
      msg.flags = MessageFlags.EPHEMERAL;
      this.commandMessage = await this.context.createMessage(msg);

      return this.commandMessage;
    }
    return (this.commandMessage = await this.editOrReply(this.context, msg));
  }

  async previous() {
    if (Array.isArray(this.pages) && this.pages.length > 0) {
      if (this.client.pageLoop) {
        await this.update(this.pages[this.index === 0 ? (this.index = this.pages.length - 1) : --this.index]);
      } else if (this.index !== 0) {
        await this.update(this.pages[--this.index]);
      } else {
        return this.commandMessage;
      }
    }
    this.emit('previous', this);
    return this.commandMessage;
  }

  async getPrevious() {
    if (Array.isArray(this.pages) && this.pages.length > 0) {
      if (this.client.pageLoop) {
        return this.pages[this.index === 0 ? (this.index = this.pages.length - 1) : --this.index];
      } else if (this.index !== 0) {
        return this.pages[--this.index];
      } else {
        return this.commandMessage;
      }
    }
    this.emit('previous', this);
    return this.commandMessage;
  }

  async next() {
    if (Array.isArray(this.pages) && this.pages.length > 0) {
      if (this.client.pageLoop) {
        await this.update(this.pages[this.index === this.pages.length - 1 ? (this.index = 0) : ++this.index]);
      } else if (this.index !== this.pages.length - 1) {
        await this.update(this.pages[++this.index]);
      } else {
        return this.commandMessage;
      }
    }
    this.emit('next', this);
    return this.commandMessage;
  }

  async getNext() {
    if (Array.isArray(this.pages) && this.pages.length > 0) {
      if (this.client.pageLoop) {
        return this.pages[this.index === this.pages.length - 1 ? (this.index = 0) : ++this.index];
      } else if (this.index !== this.pages.length - 1) {
        return this.pages[++this.index];
      } else {
        return this.commandMessage;
      }
    }
    this.emit('next', this);
    return this.commandMessage;
  }

  async jumpTo(page) {
    if (isNaN(page) || this.pages[page] === undefined) {
      throw new Error('Invalid page');
    }
    await this.update(this.pages[page]);

    this.emit('page', {
      page,
      paginator: this,
    });
    return this.commandMessage;
  }

  async appendPage(page) {
    this.pages.push(page);
  }

  stop(timeout = false) {
    this.emit('stop', this, timeout);
    this.removeAllListeners();
    const targetIndex = this.client.activeListeners.findIndex(v => v.message.id === this.message.id);
    this.client.activeListeners.splice(targetIndex, 1);
    // Disable components
    this.update({ components: [] });
    return this;
  }

  stopWithoutUpdate(timeout = false) {
    this.emit('stop', this, timeout);
    this.removeAllListeners();
    const targetIndex = this.client.activeListeners.findIndex(v => v.message.id === this.message.id);
    this.client.activeListeners.splice(targetIndex, 1);
    return this;
  }
};
