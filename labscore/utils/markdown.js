const { ICONS, ICONS_NEXTGEN, ICONS_NEXTGEN_LEGACY_MAPPINGS } = require('../constants')

// Markdown Helpers

// Check if an icon exists.
function _iconExists(icon){
  if(ICONS_NEXTGEN_LEGACY_MAPPINGS[icon]) icon = ICONS_NEXTGEN_LEGACY_MAPPINGS[icon]
  return (!ICONS_NEXTGEN[icon] || !ICONS[icon]);
}

let customIcons;
const fs = require('fs');
const path = require('path');
if(fs.existsSync(path.join(__dirname, "./emoji.json"))) customIcons = require('./emoji.json');

// Internal icon resolver
function _icon(icon){

  // In order to make self-hosting easier (in case anyone is insane enough to try this),
  // this allows for easy overwriting of the icon set that is used by the bot.
  //
  // Create an emoji.json file in this directory and provide icons like this
  // {
  //    "icon_id": "<:test:12345>"
  // }

  let _icns = structuredClone(ICONS);
  _icns = Object.assign(_icns, ICONS_NEXTGEN);

  if(customIcons) _icns = Object.assign(_icns, customIcons);

  let i = _icns.question;

  // apply nextgen icon mappings
  if(ICONS_NEXTGEN_LEGACY_MAPPINGS[icon]) icon = ICONS_NEXTGEN_LEGACY_MAPPINGS[icon]
  
  // The icon resolve order matters - nextgen icons should always take priority
  if(_icns[icon]) i = _icns[icon];

  return i.replace(/:[a-z0-9_]*:/, ':i:');
}

// Ensures potentially user-provided content won't escape pill components
function _escapeCodeblock(content){
  return content.toString().replace(/`/g, 'ˋ');
}

module.exports.icon = _icon;

module.exports.iconAsEmojiObject = function(icon){
  let i = _icon(icon);

  return {
    id: i.replace(/<a?:[a-z0-9_]*:([0-9]*)>/g,"$1"),
    name: "i",
    animated: i.startsWith("<a:")
  }
}

/**
 * Creates a favicon image via Google s2
 * @param {string} url Url
 * @param {Number} size Favicon Size
 * @returns {string} Favicon URL
 */
module.exports.favicon = function(url, size = 256){
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=${size}`
}

module.exports.weatherIcon = function(icon){
  if(!_iconExists("weather_" + icon)) return _icon("calendar");
  return _icon("weather_" + icon)
}

module.exports.highlight = function(content = ""){
  return "`" + content.toString().replace(/`/g, 'ˋ') + "`"
}

/**
 * Formats a Markdown Codeblock
 * @param type Language Type
 * @param {Array} content Lines
 * @returns {string} Formatted Codeblock
 */
module.exports.codeblock = function(type, content = []){
  if(!content.length) return "```" + type + "```"
  return "```" + type + "\n" + _escapeCodeblock(content.join('\n')) + "```"
}

module.exports.link = function(url, masked, tooltip = "", embed = false){
  if(tooltip.length) tooltip = ` '${tooltip}'`
  if(masked && !embed) return `[${masked}](<${url.replace(/\)/g, '\\)')}>${tooltip})`
  if(masked && embed) return `[${masked}](${url.replace(/\)/g, '\\)')}${tooltip})`
  return url
}

module.exports.TIMESTAMP_FLAGS = Object.freeze({
  SHORT_TIME: "t",
  LONG_TIME: "T",
  SHORT_DATE: "d",
  LONG_DATE: "D",
  SHORT_DATE_TIME: "f",
  LONG_DATE_TIME: "F",
  RELATIVE_TIME: "R"
})

module.exports.timestamp = function(time, flag = "t"){
  return `<t:${Math.floor(time/1000)}:${flag}>`
}

module.exports.stringwrap = function(content = "", length, newlines = true){
  if(!newlines) content = content.replace(/\n/g, ' ')
  if(content.length > length){
    c = content.substring(0, length-1) + '…';
    while(c.endsWith(' …')) c = c.substr(0, c.length - 2) + '…';
    return c;
  }
  return content;
}

/**
 * Limits a string to fit within a certain amount of characters.
 * Alternative to {@link stringwrap} that ensures words don't
 * get broken up in the middle.
 * @param content String Content
 * @param length Maximum Length in characters
 * @param newlines Remove newlines
 * @returns {string} Wrapped String
 */
module.exports.stringwrapPreserveWords = function(content = "", length, newlines = true){
  if(!newlines) content = content.replace(/\n/g, ' ')
  if(content.length <= length) return content;

  content = content.split(" ");
  //    content size             + amount of spaces       length + ... char
  while(content.join(" ").length + (content.length - 1) > length - 1){
    content.pop();
  }
  return content.join(" ") + "…";
}

module.exports.pill = function(content = ""){
  return "  **` " + _escapeCodeblock(content).replace(/ /g, " ") + "  `**"
}

module.exports.smallPill = function(content = ""){
  return "  ` " + _escapeCodeblock(content).replace(/ /g, " ") + " `"
}

module.exports.iconPill = function(icon, content = ""){
  return _icon(icon) + "  **` " + _escapeCodeblock(content).replace(/ /g, " ") + "  `**"
}

module.exports.smallIconPill = function(icon, content = ""){
  return _icon(icon) + "  ` " + _escapeCodeblock(content).replace(/ /g, " ") + "  `"
}

module.exports.iconLinkPill = function(icon, url, content = "", tooltip = ""){
  if(tooltip.length) tooltip = ` '${tooltip}'`
  if(content) return `${_icon(icon)} [**\` ${_escapeCodeblock(content)}  \`**](${url.replace(/\)/g, '\\)')}${tooltip})`
  return url
}

module.exports.linkPill = function(url, content = "", tooltip = ""){
  if(tooltip.length) tooltip = ` '${tooltip}'`
  if(content) return `[**\` ${_escapeCodeblock(content)} \`**](${url.replace(/\)/g, '\\)')}${tooltip})`
  return url
}

const SUPERSCRIPT_NUMBERS = ["⁰","¹","²","³","⁴","⁵","⁶","⁷","⁸","⁹"]
module.exports.citation = function(number = 1, url, tooltip = ""){
  let formatted = "";
  for(const n of number.toString().split('')) formatted += SUPERSCRIPT_NUMBERS[parseInt(n)]
  if(url){
    if(tooltip.length){
      if(tooltip.endsWith(' ')) tooltip = tooltip.substring(0, tooltip.length - 1)
      tooltip = ` '${tooltip.replace(/["*]/g, '')}'`
    }
    return `[⁽${formatted}⁾](${url.replace(/\)/g, '\\)')}${tooltip})`
  }
  return `⁽${formatted}⁾`
}