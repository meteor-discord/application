function getAcronym(guildName){
  // Based on discord-web
  return guildName.replace(/'s /g, " ").replace(/\w+/g, e => e[0]).replace(/\s/g, "") 
}

function getGuildIcon(guild){
  return (guild.iconUrl ?
    guild.iconUrl + "?size=4096" :
    // Removes emojis from the icon since this api doesn't support them, todo for the future maybe build our own image generation service for these.
    "https://ui-avatars.com/api/?background=333339&color=fff&size=512&uppercase=false&length=999&name=" + encodeURIComponent(getAcronym(guild.name).replace(/(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?(?:\u200d(?:[^\ud800-\udfff]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?)*/g, '')))
}

module.exports = {
  getAcronym,
  getGuildIcon
}