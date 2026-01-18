const { DynamicCardStack } = require('./stack');

module.exports = {
  /**
   *  Creates a new Dynamic Card Stack
   *
   *  @param {Context} context Context
   *  @param {Object} options DynamicCardStack Arguments
   *  @param {Array<string>} options.buttons Card Stack built-in navigation buttons
   *  @param {Array} options.cards Root Card Stack
   *  @param {Object} options.interactive Interactive Components
   *  @param {Number} options.startingIndex Starting card index
   *  @param {boolean} options.loop Wrap paging
   *  @param {number} options.expires Timeout for the Card Stack listener.
   *  @param {boolean} options.disableStackCache Allows disabling the stack result cache, meaning that every trigger will reevaluate a stack
   *  @param {boolean} options.pageNumbers Renders Page Numbers in the footer of all embeds in cards.
   *  @param {Function} options.pageNumberGenerator Function that renders a page number. Default style is `Page <index>/<total>`
   *  @param {boolean} options.disableCloning Disables cloning a card stack when someone other than the author interacts with it.
   *  @param {boolean} options.ephemeral Makes the response ephemeral (primarily used by cloning)
   *
   * @returns {DynamicCardStack}
   */
  createDynamicCardStack: (context, options) => {
    new DynamicCardStack(context, options);
  },
  CARD_STACK_CONSTANTS: require('./constants'),
};
