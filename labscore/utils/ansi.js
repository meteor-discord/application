const ANSI_COLORS = {
  reset: '[0m',
  black: '[30m',
  red: '[31m',
  green: '[32m',
  yellow: '[33m',
  blue: '[34m',
  magenta: '[35m',
  cyan: '[36m',
  white: '[37m',
};

const ALIASES = {
  b: 'black',
  r: 'red',
  g: 'green',
  y: 'yellow',
  bl: 'blue',
  m: 'magenta',
  c: 'cyan',
  w: 'white',
  rs: 'reset',
};

module.exports.format = function (text, color) {
  if (!ANSI_COLORS[color] && !ALIASES[color]) throw 'Invalid ANSI Color';
  if (!ANSI_COLORS[color]) color = ALIASES[color];
  return `${ANSI_COLORS[color]}${text}${ANSI_COLORS.reset}`;
};
