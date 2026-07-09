// Generate valid Tauri icon files using pure Node.js (no dependencies)
// Creates minimal valid PNG files with a purple gradient square
const { writeFileSync } = require('fs');
const { join } = require('path');
const zlib = require('zlib');

const iconsDir = join(__dirname, 'apps', 'desktop', 'src-tauri', 'icons');

function createPng(width, height) {
  // Create RGBA pixel data: purple-to-blue gradient
  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const t = x / width;
      // Purple (#8b5cf6) to Blue (#3b82f6) gradient
      pixels[i + 0] = Math.round(139 * (1 - t) + 59 * t);  // R
      pixels[i + 1] = Math.round(92 * (1 - t) + 130 * t);   // G
      pixels[i + 2] = 246;                                    // B
      pixels[i + 3] = 255;                                    // A
    }
  }

  // Build PNG
  // Filter: None (0) prepended to each scanline
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter byte
    pixels.copy(rawData, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const idat = makeChunk('IDAT', compressed);

  // IEND chunk
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);
  return Buffer.concat([len, typeBuffer, data, crc]);
}

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)) >>> 0;
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function buildIco(pngBuffers) {
  const headerSize = 6;
  const dirEntrySize = 16;
  let dataOffset = headerSize + dirEntrySize * pngBuffers.length;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngBuffers.length, 4);
  const entries = [];
  const dataList = [];
  for (const { width, height, data } of pngBuffers) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(dataOffset, 12);
    entries.push(entry);
    dataList.push(data);
    dataOffset += data.length;
  }
  return Buffer.concat([header, ...entries, ...dataList]);
}

// Generate all icon files
console.log('Generating Tauri icon files...');

const png32 = createPng(32, 32);
writeFileSync(join(iconsDir, '32x32.png'), png32);
console.log('  32x32.png');

const png128 = createPng(128, 128);
writeFileSync(join(iconsDir, '128x128.png'), png128);
console.log('  128x128.png');

const png256 = createPng(256, 256);
writeFileSync(join(iconsDir, '128x128@2x.png'), png256);
console.log('  128x128@2x.png');

// ICO with 16x16 and 32x32
const png16 = createPng(16, 16);
const ico = buildIco([
  { width: 16, height: 16, data: png16 },
  { width: 32, height: 32, data: png32 },
]);
writeFileSync(join(iconsDir, 'icon.ico'), ico);
console.log('  icon.ico');

// ICNS stub (macOS magic header)
writeFileSync(join(iconsDir, 'icon.icns'), Buffer.from([0x69, 0x63, 0x6e, 0x73, 0x00, 0x00, 0x00, 0x08]));
console.log('  icon.icns (stub)');

console.log('Done!');
