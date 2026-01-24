const { createEmbed, page } = require('#utils/embed');
const { iconAsEmojiObject, codeblock } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { STATIC_ASSETS } = require('#utils/statics');

const { MessageComponentTypes, InteractionCallbackTypes, MessageFlags } = require('detritus-client/lib/constants');
const { ComponentActionRow, ComponentButton } = require('detritus-client/lib/utils');

const { STACK_CACHE_KEYS, BuiltInButtonTypes, ResolveCallbackTypes } = require('./constants');
const { InteractiveComponentTypes, DEFAULT_BUTTON_STYLES } = require('#cardstack/constants');

/**
 * Stores all active card stacks
 * @type {WeakMap<WeakKey, DynamicCardStack>}
 */
const activeStacks = new WeakMap();

const { xid } = require('utils');

/**
 * DynamicCardStack represents an interactive stacks
 * of cards (embeds) for the user to paginate through
 * or interact with.
 */
class DynamicCardStack {
  /**
   * Creates a new DynamicCardStack
   * @param {Context} context Context
   * @param {Object} options DynamicCardStack Arguments
   * @param {Array<string>} options.buttons Card Stack built-in navigation buttons
   * @param {Array} options.cards Root Card Stack
   * @param {Object} options.interactive Interactive Components
   * @param {Number} options.startingIndex Starting card index
   * @param {boolean} options.loop Wrap paging
   * @param {number} options.expires Timeout for the Card Stack listener.
   * @param {boolean} options.disableStackCache Allows disabling the stack result cache, meaning that every trigger will reevaluate a stack
   * @param {boolean} options.pageNumbers Renders Page Numbers in the footer of all embeds in cards.
   * @param {Function} options.pageNumberGenerator Function that renders a page number. Default style is `Page <index>/<total>`
   * @param {boolean} options.disableCloning Disables cloning a card stack when someone other than the author interacts with it.
   * @param {boolean} options.flags Flags that should be used for the response message.
   */
  constructor(context, options) {
    this.context = context;
    this.options = options;

    this.cards = options.cards || [];
    this.buttons = options.buttons || ['previous', 'next'];
    this.interactive_components = options.interactive || {};
    this.index = options.startingIndex || 0;
    this.loopPages = options.loop || true;
    this.expires = options.expires || 60 * 1000;
    this.pageNumbers = options.pageNumbers || true;
    this.pageNumberGenerator =
      options.pageNumberGenerator || (pg => `Page ${pg.index + 1}/${pg.activeCardStack.length}`);
    this.disableCloning = options.disableCloning || false;
    this.flags = options.flags || 0;

    this.rootIndex = this.index;
    this.killed = false;

    this.stackCache = {};
    this.pageState = [];
    this.currentSelectedSubcategory = null;

    this.currentComponentsBatch = {};

    this.lastInteraction = Date.now();
    this.spawned = 0;

    this._spawn();
  }

  /**
   * Kills the dynamic card stack.
   */
  async kill(clearComponents) {
    clearTimeout(this.timeout);
    if (clearComponents && !this.killed) await this._edit(this.getCurrentCard(), false, true);

    this.killed = true;

    // Remove reference to free the cardstack for GC
    activeStacks.delete(this.context.message || this.context.interaction);
    delete this;
  }

  /**
   * Creates a timeout for the paginator.
   * @returns {number} Timeout
   * @private
   */
  _createTimeout() {
    return setTimeout(async () => {
      // If we have an interaction within the expiry window
      // restart the expiry window with 30s
      if (this.lastInteraction - this.spawned > 0) {
        clearTimeout(this.timeout);
        this.spawned = Date.now();
        // New expiry time is 30 seconds
        this.expires = 30 * 1000;
        this.timeout = this._createTimeout();
      } else {
        await this.kill(true);
      }
    }, this.expires);
  }

  /**
   * Get a Stack from an attached reference (message/interaction).
   * @param {Message} ref Attached message/interaction
   * @returns {DynamicCardStack}
   * @private
   */
  _getStackByReference(ref) {
    return activeStacks.get(ref);
  }

  /**
   * Attaches a cardstack to its internal reference.
   * @private
   */
  _createDynamicCardStack() {
    // Kill any previously active cardstacks on this reference
    // (prevents oddities when editing a regular command)
    if (activeStacks.get(this.context.message || this.context.interaction)) {
      this._getStackByReference(this.context.message || this.context.interaction).kill();
    }

    activeStacks.set(this.context.message || this.context.interaction, this);
  }

  /**
   * Creates a new cardstack in the given channel
   * @private
   */
  _spawn(createMessage = true) {
    this._createDynamicCardStack(this.context.client);

    this.activeCardStack = [...this.cards];

    this.updatePageState();

    this.timeout = this._createTimeout();
    this.spawned = Date.now();

    if (createMessage)
      return this._edit({
        ...this.getCurrentCard(),
      });

    return this;
  }

  /**
   * Resolves page state for all root stack cards.
   */
  updatePageState() {
    let i = 0;
    this.pageState = [];
    for (const ac of this.cards) {
      if (ac._meta) {
        this.pageState[i] = { ...ac._meta };
      }
      i++;
    }
  }

  /**
   * Gets a card from the currently active
   * stack by its index
   * @param index Page Index
   * @returns {*}
   */
  getCardByIndex(index) {
    try {
      let card = structuredClone(this.activeCardStack[index]);

      // This creates an error card with debug information
      // in case that our activeCardStack gets corrupted
      // or lost somehow (bad implementation)
      if (!this.activeCardStack[index])
        card = page(
          createEmbed('errordetail', this.context, {
            error: 'Unable to resolve card.',
            content:
              `Index: \`${this.index}\`, Stack Size: \`${this.index}\`\n` +
              (Object.keys(this.getAllStateForPage(this.index)).length >= 1
                ? codeblock('json', [JSON.stringify(this.getAllStateForPage(this.index), null, 2)]).substring(0, 5000)
                : ''),
          })
        );

      /*
      if (!card.content) card.content = "";
      card.content += `\n-# ${icon("flask_mini")} You are using the new page system • Leave feedback or report bugs in our Support Server!`
      */

      // Render Page Numbers.
      // Conditions:
      // - We have more than one card in the active stack
      // - We have embeds in the stack
      if (this.pageNumbers && card.embeds?.length && this.activeCardStack.length >= 2) {
        card.embeds = card.embeds.map(e => {
          if (!e.footer) e.footer = { text: this.pageNumberGenerator(this) };
          else {
            if (e.footer.text) e.footer.text += ` • ${this.pageNumberGenerator(this)}`;
            else e.footer.text = this.pageNumberGenerator(this);
          }
          return e;
        });
      }

      // Merge card flags with stack flags to avoid overwriting custom flags
      if (card.flags !== undefined) {
        card.flags |= this.flags;
      } else {
        card.flags = this.flags;
      }

      return card;
    } catch (e) {
      console.error('Card rendering failed:');
      console.error(e);
      return page(
        createEmbed('errordetail', this.context, {
          error: 'Unable to render card:',
          content: codeblock('js', [(e ? e.stack || e.message : e).replaceAll(process.cwd(), '')]),
        })
      );
    }
  }

  /**
   * Advances the index and returns the next card from the stack.
   * @returns {Message} Card
   */
  nextCard() {
    this.index = this.index + 1;
    if (this.index >= this.activeCardStack.length) {
      if (this.loopPages) this.index = 0;
    }

    if (this.currentSelectedSubcategory === null) this.rootIndex = this.index;
    return Object.assign(this.getCardByIndex(this.index), { components: this._renderComponents() });
  }

  /**
   * Decreases the index and returns the next card from the stack.
   * @returns {Message} Card
   */
  previousCard() {
    this.index = this.index - 1;
    if (this.index < 0) {
      if (this.loopPages) this.index = this.activeCardStack.length - 1;
      else this.index = 0;
    }

    if (this.currentSelectedSubcategory === null) this.rootIndex = this.index;
    return Object.assign(this.getCardByIndex(this.index), { components: this._renderComponents() });
  }

  /**
   * Edits the cardstack message.
   * Automatically applies and re-renders components.
   * @param {Message} cardContent Card Content
   * @param {boolean, Array} components Custom Components Array
   * @param {boolean} killComponents Remove components
   * @param {number} customFlags Optional custom flags to merge with stack flags
   */
  async _edit(cardContent, components = false, killComponents = false, customFlags = 0) {
    const message = { ...cardContent };

    message.components = this._renderComponents(killComponents);

    if (components) {
      message.components = components;
    }

    if (message._meta) delete message._meta;

    // Merge custom flags with stack flags
    const flags = this.flags | customFlags;

    try {
      return editOrReply(this.context, {
        ...message,
        reference: true,
        allowedMentions: { parse: [], repliedUser: false },
        flags,
      });
    } catch (e) {
      console.error('Message editing failed:');
      console.error(e);
    }
  }

  /**
   * Returns the currently selected card from the
   * active stack.
   * @returns {Message} Card
   */
  getCurrentCard() {
    return this.getCardByIndex(this.index);
  }

  /**
   * Retrieves state from the currently active root card
   * @param {String} key
   */
  getState(key) {
    if (typeof this.pageState[this.rootIndex] === 'undefined') return null;
    if (typeof this.pageState[this.rootIndex][key] === 'undefined') return null;
    return this.pageState[this.rootIndex][key];
  }

  /**
   * Returns all page state.
   * Only really intended for debugging purposes.
   * @returns {Object}
   */
  getAllCurrentState() {
    return this.pageState[this.rootIndex];
  }

  /**
   * Returns all page state.
   * Only really intended for debugging purposes.
   * @returns {Object}
   */
  getAllState() {
    return this.pageState;
  }

  /**
   * Returns all state for a specific page.
   * Only really intended for debugging purposes.
   * @returns {Object}
   */
  getAllStateForPage(index) {
    return this.pageState[index] || {};
  }

  /**
   * Renders an InteractiveComponent as a ComponentButton
   * @param id (Parent) Component ID
   * @param button InteractiveComponent
   * @param disabled Disabled by default
   * @returns ComponentButton Button Component
   */
  _renderButton(id, button, disabled = false) {
    // Validate if the component should be visible on this page.
    // If a function is provided we need to execute it.
    if (typeof button.visible === 'boolean' && button.visible === false) return null;
    else if (typeof button.visible === 'function' && !button.visible(this)) return null;

    const component = {
      type: MessageComponentTypes.BUTTON,
      // id/XID is used for dynamically generated components via BUTTON_GENERATOR
      customId: button.customId ? id + '/' + xid(button.customId) : id,
      style: button.style || 2,
      disabled,
    };

    // Dynamic disabling
    if (!disabled && button.condition && typeof button.condition === 'function')
      component.disabled = !button.condition(this);

    // Dynamic label
    if (button.label) {
      if (typeof button.label === 'function') component.label = button.label(this);
      else component.label = button.label;
    }

    if (button.icon) component.emoji = iconAsEmojiObject(button.icon) || undefined;

    // Change color if this is the active button.
    if (this.currentSelectedSubcategory === id) component.style = component.activeColor || 1;

    // Add to active components cache
    if (component.customId.includes('/')) this.currentComponentsBatch[component.customId] = button;

    return new ComponentButton(component);
  }

  /**
   * Renders components and button states
   * @private
   */
  _renderComponents(disabled = false) {
    // Cache of all currently active dynamically generated components.
    this.currentComponentsBatch = {};

    // Component Slots
    // We currently support up to 5 "slots" (action rows),
    // although the amount you can actually use depends
    // on how many components are added to each slot.
    const componentSlots = [[], [], [], [], []];

    // First Row always starts with built-in components
    for (const b of this.buttons) {
      const btn = {
        type: MessageComponentTypes.BUTTON,
        customId: b,
        style: 2,
        disabled: this.activeCardStack.length === 1 || disabled,
      };

      if (DEFAULT_BUTTON_STYLES[b].icon) btn.emoji = iconAsEmojiObject(DEFAULT_BUTTON_STYLES[b].icon);
      if (DEFAULT_BUTTON_STYLES[b].label) btn.label = DEFAULT_BUTTON_STYLES[b].label;

      componentSlots[0].push(new ComponentButton(btn));
    }

    for (const b of Object.keys(this.interactive_components)) {
      const button = this.interactive_components[b];
      const renderedButtons = [];
      switch (button.type) {
        case InteractiveComponentTypes.BUTTON:
          renderedButtons.push(this._renderButton(b, button, disabled));
          break;
        case InteractiveComponentTypes.BUTTON_GENERATOR: {
          // Resolve buttons to be rendered
          const _buttons = button.resolveComponents(this);
          for (const btn of _buttons) {
            renderedButtons.push(this._renderButton(b, btn, disabled));
          }
          break;
        }
        default:
          console.error('Unknown Component Type: ' + button.type + '.');
      }
      if (renderedButtons.length) {
        // null means the button shouldn't be rendered.
        for (const r of renderedButtons.filter(rb => rb !== null)) componentSlots[button.slot || 0].push(r);
      }
    }

    const renderedSlots = [];

    // Render slots
    for (const components of componentSlots) {
      if (components.length === 0) continue;

      let row = new ComponentActionRow({});

      // Slot all components into their respective rows.
      while (components.length > 0) {
        const c = components.shift();

        // Avoid adding listeners to disabled components
        // for optimization's sake
        if (c.disabled) row.addButton(c);
        else
          row.addButton({
            ...c,
            run: this._handleInteraction.bind(this),
          });

        // Create a new row for content to overflow in.
        if (row.isFull) {
          renderedSlots.push(row);
          row = new ComponentActionRow({});
        }
      }

      // Push rendered row to stack if there are components in it.
      if (!row.isEmpty) renderedSlots.push(row);
    }

    if (renderedSlots.length > 5) console.warn('Component Overflow - Limiting to 5.');

    return renderedSlots.splice(0, 5);
  }

  /**
   * Compute Cache
   *
   * The compute cache allows storing computed values
   * (i.e. resulting card stacks) in order to skip
   * re-fetching or reprocessing substacks when not
   * necessary. The cache can be disabled per-component.
   */

  /**
   * Set an internal cached computed value.
   * @param index Root Card Index
   * @param componentId Component ID
   * @param key Cache Key
   * @param value Cache Data
   * @private
   */
  _setCachedValue(index, componentId, key, value) {
    if (!this.stackCache[index]) this.stackCache[index] = {};
    if (!this.stackCache[index][componentId]) this.stackCache[index][componentId] = {};
    this.stackCache[index][componentId][key] = value;
  }

  /**
   * Gets an interactive component via its ID.
   * @param id Component ID (usually custom_id of the button)
   * @returns Interactive Component
   * @private
   */
  _getComponent(id) {
    if (id.includes('/')) return this.currentComponentsBatch[id];
    return this.interactive_components[id];
  }

  /**
   * Retrieve an internal cached computed value.
   * @param index Root Card Index
   * @param componentId Component ID
   * @param key Cache Key
   * @returns {*|null} Cached Data
   * @private
   */
  _getCachedValue(index, componentId, key) {
    if (this._getComponent(componentId).disableCache) return null;

    if (!this.stackCache[index]) return null;
    if (!this.stackCache[index][componentId]) return null;
    if (!this.stackCache[index][componentId][key]) return null;
    return this.stackCache[index][componentId][key];
  }

  /**
   * Handles an interaction from the attached components.
   * @param {ComponentContext} ctx
   * @private
   */
  async _handleInteraction(ctx) {
    if (ctx.user.id !== this.context.user.id) {
      if (this.disableCloning) return ctx.respond({ type: InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE });

      /**
       * Card Stack Cloning
       *
       * This clones the card stack in its current state, calls
       * the internal spawn function to "respawn" it under a new
       * context, then executes the triggered interaction via
       * the new "cloned" cardstack.
       *
       * This is (maybe?) kind of jank, but I can't think of any
       * better ways to ensure state and content consistency
       * without it affecting the parent cardstack somehow.
       */

      // New message that the new cardstack will attach to.
      await ctx.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {
        flags: MessageFlags.EPHEMERAL,
      });

      const newStack = Object.assign(Object.create(Object.getPrototypeOf(this)), this);

      // Reassign the context
      newStack.context = ctx;

      // Ensure all state is properly cloned to the new stack
      newStack.index = this.index;
      newStack.rootIndex = this.rootIndex;
      newStack.currentSelectedSubcategory = this.currentSelectedSubcategory;

      newStack.cards = structuredClone(this.cards);
      newStack.activeCardStack = structuredClone(this.activeCardStack);
      newStack.currentComponentsBatch = structuredClone(this.currentComponentsBatch);

      // Respawn and re-run interaction.
      await newStack._spawn(false);
      await newStack._handleInteraction(ctx);
      return;
    }

    this.lastInteraction = Date.now();

    // Built-in Buttons
    if (Object.values(BuiltInButtonTypes).includes(ctx.data.customId)) {
      switch (ctx.data.customId) {
        case 'next':
          return ctx.editOrRespond(this.nextCard());
        case 'previous':
          return ctx.editOrRespond(this.previousCard());
        default:
          console.error('unknown button??');
      }
      return;
    }

    // Interactive Components
    const cid = ctx.data.customId;
    const component = this._getComponent(cid);

    if (component) {
      // If the selected button is already active, disable it
      // and restore the root stack at its previous index.
      if (this.currentSelectedSubcategory === cid) {
        this.activeCardStack = [...this.cards];
        this.index = this.rootIndex;
        this.currentSelectedSubcategory = null;

        return await ctx.editOrRespond(Object.assign(this.getCurrentCard(), { components: this._renderComponents() }));
      } else this.currentSelectedSubcategory = cid;

      const resolveTime = Date.now();

      try {
        // If we have a cached result, retrieve it
        if (this._getCachedValue(this.rootIndex, cid, STACK_CACHE_KEYS.RESULT_CARDS) !== null) {
          this.activeCardStack = [...this._getCachedValue(this.rootIndex, cid, STACK_CACHE_KEYS.RESULT_CARDS)];
          await ctx.editOrRespond(Object.assign(this.getCurrentCard(), { components: this._renderComponents() }));
          return;
        } else {
          // Controls if we should display a loading (skeleton) embed while the
          // new stack is being fetched/rendered. Instant results should only
          // ever be used if we rely on local data or can guarantee almost-instant
          // processing/fetching times.
          if (!component.instantResult) {
            let processingEmbed = page(
              createEmbed('default', ctx, {
                image: {
                  url: STATIC_ASSETS.card_skeleton,
                },
              })
            );

            // Render a custom loading skeleton embed
            // TODO: maybe allow several loading modes here
            //    i.e COPY_PARENT which will copy select fields
            //    from the parent embed or SKELETON_WITH_TITLE.
            //      -> needs iterating on visual language first
            if (component.renderLoadingState) processingEmbed = page(component.renderLoadingState(this, component));

            await ctx.editOrRespond(Object.assign(processingEmbed, { components: this._renderComponents(true) }));
          }

          // Compute the active cardstack.
          const resolvedNewStack = await component.resolvePage(this, component);

          if (!Object.values(ResolveCallbackTypes).includes(resolvedNewStack.type))
            throw new Error(`Invalid Stack Resolve Type (${resolvedNewStack.type})`);

          switch (resolvedNewStack.type) {
            /**
             * SUBSTACK
             *
             * Replace the currently active paging
             * with a new, separate card stack to
             * page through.
             */
            case ResolveCallbackTypes.SUBSTACK:
              this.activeCardStack = resolvedNewStack.cards;
              this.index = resolvedNewStack.index || 0;

              // Cache the computed cardstack for future accessing.
              // The cache can be disabled/bypassed if we either
              // a) have huge/complex results
              // b) want to ensure data is always fresh

              // We currently only cache SUBSTACK responses, as the other
              // types probably need revalidating/re-fetching since the parent
              // has changed and might carry new data/state.
              if (!this._getComponent(ctx.data.customId).disableCache) {
                this._setCachedValue(this.rootIndex, ctx.data.customId, STACK_CACHE_KEYS.RESULT_CARDS, [
                  ...this.activeCardStack,
                ]);
              }
              break;
            /**
             * REPLACE_PARENT_CARD
             *
             * Replaces the parent card (the one this action
             * was initiated from) with a new one.
             *
             * Re-resolves all page state.
             * Unselects the button.
             */
            case ResolveCallbackTypes.REPLACE_PARENT_CARD:
              this.cards[this.rootIndex] = resolvedNewStack.card;
              this.activeCardStack = [...this.cards];
              this.updatePageState();
              this.index = resolvedNewStack.index || this.rootIndex;
              this.currentSelectedSubcategory = null;
              break;
            /**
             * REPLACE_STACK
             *
             * Replaces the entire parent
             * card stack with a new set.
             *
             * Re-resolves all page state.
             * Unselects the button.
             */
            case ResolveCallbackTypes.REPLACE_STACK:
              this.activeCardStack = resolvedNewStack.cards;
              this.updatePageState();
              this.index = resolvedNewStack.index || this.rootIndex;
              this.currentSelectedSubcategory = null;
              break;
          }
        }
      } catch (e) {
        // Display an error if we're NOT
        // in the root stack (that would break
        // things badly).
        if (this.currentSelectedSubcategory !== null)
          this.activeCardStack = [
            page(
              createEmbed('errordetail', ctx, {
                error: 'Card stack rendering failed.',
                content: codeblock('js', [(e ? e.stack || e.message : e).replaceAll(process.cwd(), '')]),
              })
            ),
          ];
        console.error('Card Resolving Failed:');
        console.error(e);
      }

      // Update the card stack with a card from the new stack.
      if (component.instantResult) {
        await ctx.editOrRespond(Object.assign(this.getCurrentCard(), { components: this._renderComponents() }));
      } else {
        // This timeout exists 1. for cosmetic reasons so people can
        // see the skeleton state and 2. in order to avoid a really
        // annoying race condition with the media proxy reverting our
        // embed to a prior state.

        // If we've already waited at least 2 seconds during processing
        // it *should* be safe to just edit the message now.
        if (Date.now() - resolveTime < 2000) {
          setTimeout(() => {
            return ctx.editOrRespond(Object.assign(this.getCurrentCard(), { components: this._renderComponents() }));
          }, 1500);
        } else {
          await ctx.editOrRespond(Object.assign(this.getCurrentCard(), { components: this._renderComponents() }));
        }
      }
      return;
    }

    console.error('Unknown button was triggered on stack: ' + ctx.data.customId);
  }
}

module.exports.DynamicCardStack = DynamicCardStack;
