module.exports.hexToDecimalColor = (color)=>{
  return parseInt(color.split("#")[1], 16)
}

module.exports.decimalToHexColor = (color)=>{
  return "#" + color.toString(16);
}