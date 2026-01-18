const formatNumber = (num, digits = 1) => {
  const lookup = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'k' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'B' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'q' },
    { value: 1e18, symbol: 'Q' },
  ];
  const regexp = /\.0+$|(?<=\.\d*[1-9])0+$/;
  const item = lookup.findLast(item => num >= item.value);

  if (!item) return '0';

  const dividedNum = num / item.value;

  const factor = Math.pow(10, digits);
  const truncatedNum = Math.floor(dividedNum * factor) / factor;
  return truncatedNum.toFixed(digits).replace(regexp, '').concat(item.symbol);
};

function toCodePoint(unicodeSurrogates, sep) {
  const r = [];
  let c = 0,
    p = 0,
    i = 0;
  while (i < unicodeSurrogates.length) {
    c = unicodeSurrogates.charCodeAt(i++);
    if (p) {
      r.push((0x10000 + ((p - 0xd800) << 10) + (c - 0xdc00)).toString(16));
      p = 0;
    } else if (0xd800 <= c && c <= 0xdbff) {
      p = c;
    } else {
      r.push(c.toString(16));
    }
  }
  return r.join(sep || '-');
}

module.exports.formatNumber = formatNumber;
module.exports.toCodePoint = toCodePoint;
