import { NextResponse } from 'next/server';
import { db, documents, passengers } from '@travelvault/db';
import { indexDocument } from '@travelvault/memory';
import { eq } from 'drizzle-orm';

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
    const body = await request.json();
    const { name, type, passengerId, filePath, ocrText } = body;

    if (!name || !type || !passengerId) {
      return NextResponse.json({ error: 'Name, Type, and Passenger ID are required.' }, { status: 400 });
    }

    // Save document to DB
    const result = await db
      .insert(documents)
      .values({
        id: crypto.randomUUID(),
        name,
        type,
        passengerId,
        filePath: filePath || '',
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
