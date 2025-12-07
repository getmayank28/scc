// utils/encodeDecode.ts

/**
 * Encode a string to Base64
 * @param str - input string
 * @returns Base64 encoded string
 */
export const encodeBase64 = (str: string): string => {
  return Buffer.from(str, "utf-8").toString("base64");
};

/**
 * Decode a Base64 string
 * @param encodedStr - Base64 encoded string
 * @returns Decoded string
 */
export const decodeBase64 = (encodedStr: string): string => {
  return Buffer.from(encodedStr, "base64").toString("utf-8");
};
