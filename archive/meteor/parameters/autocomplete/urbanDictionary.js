const { stringwrap } = require('#utils/markdown');
const superagent = require('superagent');

module.exports = async context => {
  let choices = [];
  if (context.value) {
    try {
      const suggestions = await superagent.get('https://api.urbandictionary.com/v0/autocomplete-extra').query({
        term: context.value,
      });

      choices = suggestions.body.results;
    } catch {
      // idk sucks ig?
    }
  }

  return context.respond({
    choices: choices.splice(0, 20).map(l => ({
      name: `${l.term} - ${stringwrap(l.preview, 20, false)}`,
      value: l.term,
    })),
  });
};
