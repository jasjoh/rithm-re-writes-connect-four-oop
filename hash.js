"use strict";

/** Simple function to generate hexadecimal MD5 hashes from strings */

function generateMD5HashHex(string) {
  let currentHashVal = 0;

  for (let char of string) {
    currentHashVal = (currentHashVal << 5) - currentHashVal + char.charCodeAt(0);
  }

  return (currentHashVal >>> 0).toString(16);
}