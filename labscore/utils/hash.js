// Adapted from https://github.com/google/closure-compiler/blob/master/src/com/google/javascript/jscomp/Xid.java
const START_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CHARS = START_CHARS + "0123456789";
const START_RADIX = START_CHARS.length;
const RADIX = CHARS.length;

/**
 * A simple utility for shortening identifiers in a stable way. Generates
 * short substitution strings deterministically, using a compact
 * (1 to 6 characters in length) repesentation of a 32-bit hash of the key.
 * The string is suitable to be used as a JavaScript or CSS identifier.
 * Collisions are possible but unlikely, depending on the underlying hash algorithm used.
 *
 * This substitution scheme uses case-sensitive names for maximum
 * compression. Digits are also allowed in all but the first character of a
 * class name. There are a few characters allowed by the CSS grammar that we
 * choose not to use (e.g. the underscore and hyphen), to keep names simple.
 *
 * Xid should maintain as minimal dependencies as possible to ease its
 * integration with other tools, such as server side HTML generators.
 *
 * (https://github.com/google/closure-compiler/blob/master/src/com/google/javascript/jscomp/Xid.java#L18-L32)
 *
 * @param input Input
 * @returns {string} Xid
 */
module.exports.Xid = (input) => {
  if(typeof(input)==="string"){
    var h = 0, i, c;
    if (input.length === 0) return h;
    for (i = 0; i < input.length; i++) {
      c = input.charCodeAt(i);
      h = ((h << 5) - h) + c;
      h |= 0;
    }
    if(h<=0) h = h*-1;
    input = h;
  }

  const buf = new Array(6);
  let len = 0;

  let l = input - Math.floor(Number.MIN_SAFE_INTEGER);
  buf[len++] = START_CHARS.charAt(Math.floor(l % START_RADIX));
  input = Math.floor(l / START_RADIX);

  while (input > 0) {
    buf[len++] = CHARS.charAt(input % RADIX);
    input = Math.floor(input / RADIX);
  }

  return buf.slice(0, len).reverse().join("");
}