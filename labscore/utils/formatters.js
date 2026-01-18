export const formatNumber = (num, digits = 1) => {
  const lookup = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'k' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'B' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'q' },
    { value: 1e18, symbol: 'Q' },
  ];
  const regexp = /\.0+$|(?<=\.[0-9]*[1-9])0+$/;
  const item = lookup.findLast(item => num >= item.value);

  if (!item) return '0';

  const dividedNum = num / item.value;

  const factor = Math.pow(10, digits);
  const truncatedNum = Math.floor(dividedNum * factor) / factor;
  return truncatedNum.toFixed(digits).replace(regexp, '').concat(item.symbol);
};
