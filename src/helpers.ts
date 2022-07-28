import { join as pathJoin } from "node:path";

function encodeString(str: string | null) {
  if (str === null) return String.fromCharCode(0);

  const encoded = Buffer.from(str);

  let data;
  let len = encoded.length;
  let offset = 0;

  if (len < 0x80) {
    data = Buffer.alloc(len + 1);
    data[offset++] = len;
  } else if (len < 0x4000) {
    data = Buffer.alloc(len + 2);
    len |= 0x8000;
    data[offset++] = (len >> 8) & 0xff;
    data[offset++] = len & 0xff;
  } else if (len < 0x200000) {
    data = Buffer.alloc(len + 3);
    len |= 0xc00000;
    data[offset++] = (len >> 16) & 0xff;
    data[offset++] = (len >> 8) & 0xff;
    data[offset++] = len & 0xff;
  } else if (len < 0x10000000) {
    data = Buffer.alloc(len + 4);
    len |= 0xe0000000;
    data[offset++] = (len >> 24) & 0xff;
    data[offset++] = (len >> 16) & 0xff;
    data[offset++] = (len >> 8) & 0xff;
    data[offset++] = len & 0xff;
  } else {
    data = Buffer.alloc(len + 5);
    data[offset++] = 0xf0;
    data[offset++] = (len >> 24) & 0xff;
    data[offset++] = (len >> 16) & 0xff;
    data[offset++] = (len >> 8) & 0xff;
    data[offset++] = len & 0xff;
  }

  data.fill(encoded, offset);
  return data;
}

function decodeLength(data: Buffer) {
  let len;
  let idx = 0;
  const b = data[idx++];

  if (b & 128) {
    if ((b & 192) === 128) {
      len = ((b & 63) << 8) + data[idx++];
    } else {
      if ((b & 224) === 192) {
        len = ((b & 31) << 8) + data[idx++];
        len = (len << 8) + data[idx++];
      } else {
        if ((b & 240) === 224) {
          len = ((b & 15) << 8) + data[idx++];
          len = (len << 8) + data[idx++];
          len = (len << 8) + data[idx++];
        } else {
          len = data[idx++];
          len = (len << 8) + data[idx++];
          len = (len << 8) + data[idx++];
          len = (len << 8) + data[idx++];
        }
      }
    }
  } else {
    len = b;
  }

  return [idx, len];
}

function useSentenceParser(buffer: Buffer, callback: (line: string) => void) {
  while (buffer.length > 0) {
    const [idx, length] = decodeLength(buffer);
    const line = Buffer.from(buffer.slice(idx, length + 1)).toString();

    callback(line);

    buffer = buffer.slice(length + 1);
  }
}

function buildPath(...path: string[]) {
  return !path.join("").startsWith("/")
    ? pathJoin("/", ...path)
    : pathJoin(...path);
}

export { encodeString, decodeLength, buildPath, useSentenceParser };
