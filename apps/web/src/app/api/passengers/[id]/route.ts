import { NextResponse } from 'next/server';
import { db, passengers, memories } from '@travelvault/db';
import { deleteMemory } from '@travelvault/memory';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const data = await db.select().from(passengers).where(eq(passengers.id, id));
    if (data.length === 0) {
      return NextResponse.json({ error: 'Passenger not found' }, { status: 404 });
    }

    return NextResponse.json(data[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Delete passenger profile
    await db.delete(passengers).where(eq(passengers.id, id));

    // Delete associated passenger memory index
    try {
      await deleteMemory(`passenger-${id}`);
    } catch (e) {
      console.error('Failed to delete memory index:', e);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
