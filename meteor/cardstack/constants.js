module.exports.BuiltInButtonTypes = Object.freeze({
  NEXT_PAGE: 'next',
  PREVIOUS_PAGE: 'previous',
});

module.exports.DEFAULT_BUTTON_STYLES = Object.freeze({
  [this.BuiltInButtonTypes.NEXT_PAGE]: {
    label: '❯',
  },
  [this.BuiltInButtonTypes.PREVIOUS_PAGE]: {
    label: '❮',
  },
});

module.exports.STACK_CACHE_KEYS = Object.freeze({
  RESULT_CARDS: 0,
});

/**
 * Callback Types for a Dynamic Card Stack
 * Component resolve.
 *
 * - `SUBSTACK` - Creates a "submenu" with a brand new cardstack
 * - `REPLACE_PARENT` - Replaces the parent card in the root stack
 *    - This callback type will also unselect the button
 * - `REPLACE_ROOT_STACK` - Replaces the root stack
 *    - This callback type will also unselect the button
 *
 * @readonly
 * @enum {number}
 */
module.exports.ResolveCallbackTypes = Object.freeze({
  UNKNOWN_CALLBACK_TYPE: 0,
  SUBSTACK: 1,
  REPLACE_PARENT_CARD: 2,
  REPLACE_STACK: 3,
});

/**
 * @typedef {number} InteractiveComponentTypes
 **/

/**
 * Interactive Component Type
 *
 * @readonly
 * @enum {InteractiveComponentTypes}
 */
module.exports.InteractiveComponentTypes = Object.freeze({
  /** Unknown Component Value */
  UNKNOWN_COMPONENT_TYPE: 0,
  /** A singular dynamic button */
  BUTTON: 1,
  /** Button generator that can return as many buttons as are necessary. */
  BUTTON_GENERATOR: 2,
});
