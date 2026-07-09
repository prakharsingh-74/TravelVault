import sharp from 'sharp';
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcImage = process.argv[2];
const iconsDir = join(__dirname, 'src-tauri', 'icons');

async function generatePngs() {
  // 32x32
  await sharp(srcImage).resize(32, 32).png().toFile(join(iconsDir, '32x32.png'));
  console.log('✓ 32x32.png');

  // 128x128
  await sharp(srcImage).resize(128, 128).png().toFile(join(iconsDir, '128x128.png'));
  console.log('✓ 128x128.png');

  // 128x128@2x (256x256)
  await sharp(srcImage).resize(256, 256).png().toFile(join(iconsDir, '128x128@2x.png'));
  console.log('✓ 128x128@2x.png');

  // icon.icns placeholder — on Windows Tauri doesn't actually need this,
  // but we need a non-empty file. Write the icns magic number + minimal header.
  const icnsMagic = Buffer.from([0x69, 0x63, 0x6e, 0x73, 0x00, 0x00, 0x00, 0x08]);
  writeFileSync(join(iconsDir, 'icon.icns'), icnsMagic);
  console.log('✓ icon.icns (stub)');

  // icon.ico — build a valid ICO from 32x32 and 16x16 PNGs
  const png32 = await sharp(srcImage).resize(32, 32).png().toBuffer();
  const png16 = await sharp(srcImage).resize(16, 16).png().toBuffer();

  const ico = buildIco([
    { width: 16, height: 16, data: png16 },
    { width: 32, height: 32, data: png32 },
  ]);
  writeFileSync(join(iconsDir, 'icon.ico'), ico);
  console.log('✓ icon.ico');
}

function buildIco(images) {
  // ICO header: 6 bytes
  // Each directory entry: 16 bytes
  // Then raw PNG data for each image
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * images.length;
  let dataOffset = headerSize + dirSize;

  // Header
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);              // reserved
  header.writeUInt16LE(1, 2);              // type: 1 = ICO
  header.writeUInt16LE(images.length, 4);  // image count

  const entries = [];
  const dataBuffers = [];

  for (const img of images) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);   // width
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);  // height
    entry.writeUInt8(0, 2);              // color palette
    entry.writeUInt8(0, 3);              // reserved
    entry.writeUInt16LE(1, 4);           // color planes
    entry.writeUInt16LE(32, 6);          // bits per pixel
    entry.writeUInt32LE(img.data.length, 8);  // data size
    entry.writeUInt32LE(dataOffset, 12);      // data offset

    entries.push(entry);
    dataBuffers.push(img.data);
    dataOffset += img.data.length;
  }

  return Buffer.concat([header, ...entries, ...dataBuffers]);
}

generatePngs().then(() => {
  console.log('\nAll icons generated successfully.');
}).catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
