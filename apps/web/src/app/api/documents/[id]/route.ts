import { NextResponse } from 'next/server';
import { db, documents } from '@travelvault/db';
import { deleteMemory } from '@travelvault/memory';
import { eq } from 'drizzle-orm';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Delete document metadata from DB
    await db.delete(documents).where(eq(documents.id, id));

    // Delete associated document memory index
    try {
      await deleteMemory(`doc-${id}`);
    } catch (e) {
      console.error('Failed to delete document memory index:', e);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
