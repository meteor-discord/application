const { DICTIONARY_LANGUAGES, DICTIONARY_DEFAULT_LANGUAGES} = require("#constants");
const { getDictionaryFromAny } = require("#utils/translate");

module.exports = async (context)=>{
  let choices = [];
  if(context.value){
    choices = getDictionaryFromAny(context.value)
  } else {
    // Default language suggestions
    choices = Object.assign([], DICTIONARY_DEFAULT_LANGUAGES)
  }

  return context.respond({ choices: choices.splice(0, 20).map((l)=>({
    name: DICTIONARY_LANGUAGES[l],
    value: l
  }))});
}