import zlib from 'zlib';

/**
 * Pure Node.js helper to extract readable text from a PDF Buffer
 * by decompressing FlateDecode streams and parsing text operators.
 */
export function extractTextFromPdf(pdfBuffer: Buffer): string {
  let textContent = '';
  let offset = 0;

  while (offset < pdfBuffer.length) {
    const streamStart = pdfBuffer.indexOf('stream', offset);
    if (streamStart === -1) break;

    // Find the end of the stream
    const streamEnd = pdfBuffer.indexOf('endstream', streamStart);
    if (streamEnd === -1) break;

    // Stream content starts after the newline after 'stream' keyword
    let dataStart = streamStart + 6;
    if (pdfBuffer[dataStart] === 13) dataStart++; // \r
    if (pdfBuffer[dataStart] === 10) dataStart++; // \n

    const streamData = pdfBuffer.subarray(dataStart, streamEnd);

    // Look backwards from streamStart to find the object directory << ... >>
    const dictStart = pdfBuffer.lastIndexOf('<<', streamStart);
    let isCompressed = false;

    if (dictStart !== -1 && dictStart > offset) {
      const dictText = pdfBuffer.toString('utf-8', dictStart, streamStart);
      if (dictText.includes('/FlateDecode')) {
        isCompressed = true;
      }
    }

    let decompressed: Buffer | null = null;
    if (isCompressed) {
      try {
        decompressed = zlib.inflateSync(streamData);
      } catch (err) {
        try {
          decompressed = zlib.inflateRawSync(streamData);
        } catch {
          // Skip if stream is an image or font stream that failed decompressing
        }
      }
    } else {
      decompressed = streamData;
    }

    if (decompressed) {
      const decoded = decompressed.toString('latin1');
      
      // 1. Text operator (string) Tj or (string) TJ
      const textRegex = /\(([^)]+)\)\s*(?:Tj|TJ)/g;
      let match;
      while ((match = textRegex.exec(decoded)) !== null) {
        textContent += match[1] + ' ';
      }

      // 2. Bracketed array of text parts: [ (part1) 10 (part2) ] TJ
      const bracketRegex = /\[([^\]]+)\]\s*TJ/g;
      let bracketMatch;
      while ((bracketMatch = bracketRegex.exec(decoded)) !== null) {
        const innerArray = bracketMatch[1];
        const innerTextRegex = /\(([^)]+)\)/g;
        let innerTextMatch;
        while ((innerTextMatch = innerTextRegex.exec(innerArray)) !== null) {
          textContent += innerTextMatch[1] + ' ';
        }
      }
    }

    offset = streamEnd + 9;
  }

  return cleanPdfText(textContent);
}

function cleanPdfText(text: string): string {
  return text
    .replace(/\\([\d]{3})/g, (m, octal) => String.fromCharCode(parseInt(octal, 8)))
    .replace(/\\(.)/g, '$1')
    .replace(/\r/g, '')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
