// URL regex pattern for matching HTTP(S) URLs and www links
const URL_REGEX =
  /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.\S{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.\S{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.\S{2,}|www\.[a-zA-Z0-9]+\.\S{2,})/g;

// Domain validator regex for matching domain names with optional protocol and port
const DOMAIN_REGEX =
  /^(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})*(?::\d{1,5})?(?:\/\S*)?$/g;

// General HTTP(S) URL regex for matching web URLs
const HTTP_URL_REGEX = /https?:\/\/(www\.)?[-\w@:%.+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([^> \n]*)/;

module.exports.URL_REGEX = URL_REGEX;
module.exports.DOMAIN_REGEX = DOMAIN_REGEX;
module.exports.HTTP_URL_REGEX = HTTP_URL_REGEX;
