import { NextResponse } from 'next/server';
import { db, documents, passengers } from '@travelvault/db';
import { indexDocument, generateText } from '@travelvault/memory';
import { eq } from 'drizzle-orm';
import { extractTextFromPdf } from '../../../lib/pdfExtractor';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const data = await db.select().from(documents);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    let name = '';
    let type = '';
    let passengerId = '';
    let ocrText = '';
    let originalFileName = '';
    let savedFilePath = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      name = formData.get('name') as string;
      type = formData.get('type') as string;
      passengerId = formData.get('passengerId') as string;
      ocrText = (formData.get('ocrText') as string) || '';
      
      const file = formData.get('file') as File | null;
      if (file) {
        originalFileName = file.name;
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        // Ensure upload directory exists
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        // Save file locally with UUID to avoid collision
        const fileExtension = originalFileName.split('.').pop() || '';
        const savedFileName = `${crypto.randomUUID()}.${fileExtension}`;
        const absolutePath = join(uploadDir, savedFileName);
        
        await writeFile(absolutePath, fileBuffer);
        savedFilePath = `/uploads/${savedFileName}`;

        // If it's a PDF, try to extract the text server-side if client didn't supply it
        if (originalFileName.toLowerCase().endsWith('.pdf') && !ocrText) {
          try {
            ocrText = extractTextFromPdf(fileBuffer);
          } catch (pdfErr) {
            console.error('Failed to parse PDF text:', pdfErr);
            ocrText = 'PDF loaded (unparseable or image-only PDF)';
          }
        }
      }
    } else {
      // Fallback to JSON request
      const body = await request.json();
      name = body.name;
      type = body.type;
      passengerId = body.passengerId;
      savedFilePath = body.filePath || '';
      ocrText = body.ocrText || '';
    }

    if (!name || !type || !passengerId) {
      return NextResponse.json({ error: 'Name, Type, and Passenger ID are required.' }, { status: 400 });
    }

    // AI receipt text extraction to structured JSON
    if (type === 'Receipt' && ocrText) {
      try {
        const prompt = `You are a receipt details extractor. Analyze the following receipt text and extract the details strictly in this JSON format:
{
  "merchant": "Store or merchant name",
  "amount": number_amount_only,
  "currency": "INR or USD or EUR etc.",
  "date": "YYYY-MM-DD",
  "category": "Food" or "Transport" or "Hotel" or "Other"
}
Return only the raw JSON. No explanation, no markdown backticks, no notes.
Receipt Text:
${ocrText}`;

        const rawResult = await generateText(prompt);
        const jsonMatch = rawResult.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          ocrText = jsonMatch[0];
        } else {
          ocrText = JSON.stringify({
            merchant: name,
            amount: 0,
            currency: 'INR',
            date: new Date().toISOString().split('T')[0],
            category: 'Other'
          });
        }
      } catch (err) {
        console.error('Failed to parse receipt with AI:', err);
        ocrText = JSON.stringify({
          merchant: name,
          amount: 0,
          currency: 'INR',
          date: new Date().toISOString().split('T')[0],
          category: 'Other'
        });
      }
    }

    // Save document to DB
    const result = await db
      .insert(documents)
      .values({
        id: crypto.randomUUID(),
        name,
        type,
        passengerId,
        filePath: savedFilePath || originalFileName || '',
        ocrText: ocrText || '',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    const savedDoc = result[0];

    // Fetch passenger name to create a better semantic memory content
    let passengerName = 'Unknown Passenger';
    if (savedDoc.passengerId) {
      const passengerData = await db.select().from(passengers).where(eq(passengers.id, savedDoc.passengerId));
      passengerName = passengerData[0]?.name || 'Unknown Passenger';
    }

    // Index document in local semantic memory
    try {
      await indexDocument({
        id: savedDoc.id,
        name: savedDoc.name,
        type: savedDoc.type,
        passengerId: savedDoc.passengerId,
        filePath: savedDoc.filePath,
        ocrText: savedDoc.ocrText
      }, passengerName);
    } catch (indexError) {
      console.error('Failed to index document in semantic memory:', indexError);
    }

    return NextResponse.json(savedDoc);
  } catch (error: any) {
    console.error('Failed to save document:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
