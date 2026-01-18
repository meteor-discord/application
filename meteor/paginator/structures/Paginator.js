const { COMPONENT_BUTTON_ICONS } = require('#constants');
const { MessageFlags } = require('detritus-client/lib/constants');
const InteractionPaginator = require('./InteractionPaginator');
const assert = require('assert');

const { Constants, Utils } = require('detritus-client');
const { Components } = Utils;
const { InteractionCallbackTypes } = Constants;

const allowedEvents = new Set(['MESSAGE_CREATE']);

const { hasOwnProperty } = Object.prototype;

const instances = new WeakSet();

module.exports = class Paginator {
  constructor(client, data = {}) {
    if (instances.has(client)) {
      throw new Error('Only attach one pagination client');
    }

    assert.ok(hasOwnProperty.call(client, 'gateway'), 'Provided `client` has no `gateway` property.');

    this.client = client;
    this.maxTime = data.maxTime || 300000;
    this.pageLoop = typeof data.pageLoop !== 'boolean' ? false : data.pageLoop;
    this.pageNumber = typeof data.pageNumber !== 'boolean' ? false : data.pageNumber;
    this.activeListeners = [];

    this.client.gateway.on('packet', async packet => {
      const { d: data, t: event } = packet;
      if (!data) return;
      if (!allowedEvents.has(event)) return;

      for (const listener of this.activeListeners) {
        if (!(listener instanceof InteractionPaginator)) continue;
        if (!listener.commandMessage) continue;

        if (
          event === 'MESSAGE_CREATE' &&
          listener.isInChannel(data.channel_id) &&
          listener.isTarget(data.user_id) &&
          listener.waitingForPage
        ) {
          await this.handleMessageEvent(data, listener);
        }
      }
    });
  }

  async handleButtonEvent(context) {
    let listener;
    for (const l of this.activeListeners) {
      if (!(l instanceof InteractionPaginator)) continue;
      if (!l.commandMessage) continue;
      if (l.isCommandMessage(context.message.id)) {
        listener = l;
      }
    }

    // If person that interacted isnt the target, send a generic ping response and ignore it
    if (!listener.isTarget(context.user.id)) {
      // If ephemeral cloning is disabled ignore the interaction
      if (listener.disableCloning) return await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);

      await context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {
        flags: MessageFlags.EPHEMERAL,
      });

      // (this is very hacky but the best i can think of right now)
      // clones the current paginator and attaches a new one to that response

      // i have plans to fix this with pagination v2 whenever i get around to working on it

      const newPaginator = Object.assign(Object.create(Object.getPrototypeOf(listener)), listener);

      newPaginator.context = context;
      newPaginator.targetUser = context.user.id;
      newPaginator.ephemeral = true;

      if (context.customId === 'next') await newPaginator.getNext();
      else if (context.customId === 'previous') await newPaginator.getPrevious();

      this.activeListeners.push(newPaginator);
      await newPaginator.init();
      return;
    }

    // Respond
    switch (context.customId) {
      case 'next':
        await context.respond(InteractionCallbackTypes.UPDATE_MESSAGE, await listener.getNext());
        break;
      case 'previous':
        await context.respond(InteractionCallbackTypes.UPDATE_MESSAGE, await listener.getPrevious());
        break;
      case 'stop':
        await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
        listener.stop();
        break;
      default:
        // Emit the button as an event
        listener.emit('interaction', { context, listener });
        break;
    }

    return;
  }

  async handleMessageEvent(data, listener) {
    const page = parseInt(data.content, 10);
    if (isNaN(page)) {
      return;
    }

    listener
      .jumpTo(page - 1)
      .then(async () => {
        try {
          await listener.waitingForPage.delete();
          await this.client.rest.deleteMessage(data.channel_id, data.id);
        } catch {
          // Ignore deletion errors
        }

        listener.waitingForPage = null;
      })
      .catch(() => {});
  }

  async components() {
    const components = new Components({
      timeout: this.expires,
      run: this.handleButtonEvent.bind(this),
    });

    for (const b of this.buttons) {
      // If an object is provided, build button from that
      if (typeof b === 'object') {
        components.createButton({
          customId: 'custom',
          disabled: 0,
          style: 2,
          emoji: COMPONENT_BUTTON_ICONS.UNKNOWN,
          ...b,
        });
      } else {
        components.createButton({
          customId: b,
          disabled: 0,
          style: 2,
          emoji: COMPONENT_BUTTON_ICONS[b.toUpperCase()],
        });
      }
    }

    return components;
  }

  async createPaginator(data) {
    if (this.pageNumber && Array.isArray(data.pages)) {
      for (let i = 0; i < data.pages.length; ++i) {
        // Page numbering logic would go here
      }
    }

    // Check if a paginator exists, if it does kill the old one
    let listener;
    for (const l of this.activeListeners) {
      if (!(l instanceof InteractionPaginator)) continue;
      if (!l.commandMessage) continue;

      if (data.context.message?.id && l.isCommandMessage(data.context.message.id)) {
        listener = l;
      }
    }
    if (listener) await listener.stop();

    const instance = new InteractionPaginator(this, data);
    this.activeListeners.push(instance);

    setTimeout(() => {
      instance.stop(true);
    }, data.maxTime || this.maxTime);

    // Edit below to change default button set
    this.buttons = typeof data.buttons !== 'object' ? ['previous', 'next'] : data.buttons;

    // No need for a paginator if we only have one page.
    if (data.pages.length === 1) {
      if (this.buttons) this.buttons = this.buttons.filter(i => !['next', 'previous'].includes(i));
    }

    if (instance.commandMessage === null && data.pages) {
      await instance.init();
    }

    return instance;
  }
};
