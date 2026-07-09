import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join } from 'path';

const srcImage = process.argv[2];
const iconsDir = join('E:', 'code', 'travel vault', 'apps', 'desktop', 'src-tauri', 'icons');

async function generatePngs() {
  // 32x32
  await sharp(srcImage).resize(32, 32).png().toFile(join(iconsDir, '32x32.png'));
  console.log('OK 32x32.png');

  // 128x128
  await sharp(srcImage).resize(128, 128).png().toFile(join(iconsDir, '128x128.png'));
  console.log('OK 128x128.png');

  // 128x128@2x (256x256)
  await sharp(srcImage).resize(256, 256).png().toFile(join(iconsDir, '128x128@2x.png'));
  console.log('OK 128x128@2x.png');

  // icon.icns stub (macOS magic header — not needed on Windows)
  const icnsMagic = Buffer.from([0x69, 0x63, 0x6e, 0x73, 0x00, 0x00, 0x00, 0x08]);
  writeFileSync(join(iconsDir, 'icon.icns'), icnsMagic);
  console.log('OK icon.icns (stub)');

  // icon.ico from 16x16 + 32x32 PNGs
  const png32 = await sharp(srcImage).resize(32, 32).png().toBuffer();
  const png16 = await sharp(srcImage).resize(16, 16).png().toBuffer();
  const ico = buildIco([
    { width: 16, height: 16, data: png16 },
    { width: 32, height: 32, data: png32 },
  ]);
  writeFileSync(join(iconsDir, 'icon.ico'), ico);
  console.log('OK icon.ico');
}

function buildIco(images) {
  const headerSize = 6;
  const dirEntrySize = 16;
  let dataOffset = headerSize + dirEntrySize * images.length;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  const dataBuffers = [];
  for (const img of images) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(img.data.length, 8);
    entry.writeUInt32LE(dataOffset, 12);
    entries.push(entry);
    dataBuffers.push(img.data);
    dataOffset += img.data.length;
  }
  return Buffer.concat([header, ...entries, ...dataBuffers]);
}

generatePngs().then(() => console.log('Done.')).catch(e => { console.error(e); process.exit(1); });
