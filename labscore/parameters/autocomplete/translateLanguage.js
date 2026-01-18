const { TRANSLATE_LANGUAGES, TRANSLATE_DEFAULT_LANGUAGE_LIST, TRANSLATE_AUTOCOMPLETE_HIDDEN_LANGUAGES } = require("#constants");
const { getLanguagesFromAny } = require("#utils/translate");

module.exports = async (context)=>{
  let choices = [];
  if(context.value){
    choices = getLanguagesFromAny(context.value)
  } else {
    // Default language suggestions
    choices = Object.assign([], TRANSLATE_DEFAULT_LANGUAGE_LIST)
  }

  choices = choices.filter((c)=>!TRANSLATE_AUTOCOMPLETE_HIDDEN_LANGUAGES.includes(c))
  
  return context.respond({ choices: choices.splice(0, 20).map((l)=>({
    name: TRANSLATE_LANGUAGES[l],
    value: l
  }))});
}