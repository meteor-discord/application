const { createEmbed, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');

const { createDynamicCardStack } = require('#cardstack/index');
const { ResolveCallbackTypes, InteractiveComponentTypes } = require('#cardstack/constants');

module.exports = {
  label: 'text',
  name: 'test',
  metadata: {
    description: 'test.',
    description_short: 'test',
    examples: ['test'],
    category: 'dev',
    usage: 'test',
  },
  onBefore: context => context.user.isClientOwner,
  onCancel: () => {},
  run: async context => {
    await acknowledge(context);

    try {
      // This will create a new dynamic card stack
      return createDynamicCardStack(context, {
        cards: [
          createEmbed('default', context, { description: 'page 1' }),
          createEmbed('default', context, { description: 'page 2. this has a conditional button.' }),
        ].map((p, index) => page(p, {}, { key: `t_${index}` })),
        pageNumberGenerator: pg => {
          return `Test ${pg.index}`;
        },
        expires: 10000,
        interactive: {
          always_active_button: {
            type: InteractiveComponentTypes.BUTTON,
            label: 'single sub page',
            slot: 1,
            visible: true,
            disableCache: true,
            resolvePage: () => {
              return {
                type: ResolveCallbackTypes.SUBSTACK,
                cards: [createEmbed('success', context, 'smiley')].map(p => page(p)),
              };
            },
          },
          always_active_button1: {
            type: InteractiveComponentTypes.BUTTON,
            label: 'single sub page',
            slot: 1,
            visible: true,
            disableCache: true,
            resolvePage: () => {
              return {
                type: ResolveCallbackTypes.SUBSTACK,
                cards: [createEmbed('success', context, 'smiley')].map(p => page(p)),
              };
            },
          },
          always_active_button2: {
            type: InteractiveComponentTypes.BUTTON,
            label: 'single sub page',
            slot: 1,
            visible: true,
            disableCache: true,
            resolvePage: () => {
              return {
                type: ResolveCallbackTypes.SUBSTACK,
                cards: [createEmbed('success', context, 'smiley')].map(p => page(p)),
              };
            },
          },
          always_active_button3: {
            type: InteractiveComponentTypes.BUTTON,
            label: 'single sub page',
            slot: 1,
            visible: true,
            disableCache: true,
            resolvePage: () => {
              return {
                type: ResolveCallbackTypes.SUBSTACK,
                cards: [createEmbed('success', context, 'smiley')].map(p => page(p)),
              };
            },
          },
          always_active_button4: {
            type: InteractiveComponentTypes.BUTTON,
            label: 'single sub page',
            slot: 1,
            visible: true,
            disableCache: true,
            resolvePage: () => {
              return {
                type: ResolveCallbackTypes.SUBSTACK,
                cards: [createEmbed('success', context, 'smiley')].map(p => page(p)),
              };
            },
          },
          always_active_button5: {
            type: InteractiveComponentTypes.BUTTON,
            label: 'single sub page',
            visible: true,
            disableCache: true,
            resolvePage: () => {
              return {
                type: ResolveCallbackTypes.SUBSTACK,
                cards: [createEmbed('success', context, 'smiley')].map(p => page(p)),
              };
            },
          },
          conditional_button: {
            type: InteractiveComponentTypes.BUTTON,
            // Button Label
            label: 'Conditional',
            visible: page => {
              return page.getState('key') === 't_1';
            },
            resolvePage: () => {
              return {
                type: ResolveCallbackTypes.SUBSTACK,
                cards: [
                  createEmbed('default', context, { description: 'this is a conditional sub page' }),
                  createEmbed('default', context, { description: 'this is a conditional sub page two' }),
                ].map(p => page(p)),
              };
            },
          },
          dynamic_button: {
            type: InteractiveComponentTypes.BUTTON,
            slot: 3,
            // Button Label
            label: page => {
              console.log(page.getState('key'));
              return page.getState('key') || 'test';
            },
            // Next to pagination or new row
            inline: false,
            visible: true,
            // Renders the loading state card
            renderLoadingState: () => {
              return createEmbed('default', context, {
                description: '-# replacing papa card',
              });
            },
            resolvePage: async () => {
              console.log('resolving page');
              return {
                type: ResolveCallbackTypes.REPLACE_PARENT_CARD,
                card: page(
                  createEmbed('default', context, { description: 'this is the new over lord ' + new Date() }),
                  {},
                  {
                    key: Date.now(),
                  }
                ),
              };
            },
          },
        },
      });
    } catch (e) {
      console.log(e);
    }
  },
};
