const { stringwrap } = require('#utils/markdown');
const superagent = require('superagent');

module.exports = async context => {
  let choices = [];
  if (context.value) {
    try {
      let suggestions = await superagent.get('https://www.google.com/complete/search').query({
        client: 'dictionary-widget',
        hl: 'en',
        requiredfields: 'corpus:en-us',
        q: context.value,
      });

      suggestions = JSON.parse(suggestions.text.substring(19, suggestions.text.length - 1));
      choices = suggestions[1].map(m => m[0]);

      // Additional checks
      if (choices.includes(context.value.toLowerCase())) {
        choices = choices.filter(m => m !== context.value.toLowerCase());
        choices.unshift(context.value.toLowerCase());
      }
    } catch (e) {
      // idk sucks ig?
    }
  }

  return context.respond({
    choices: choices.splice(0, 20).map(l => ({
      name: l,
      value: l,
    })),
  });
};
