import { NextResponse } from 'next/server';
import { db, settings, passengers, documents, memories } from '@travelvault/db';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const list = await db.select().from(settings);
    const data = list.reduce((acc: any, cur) => {
      acc[cur.key] = cur.value;
      return acc;
    }, {});
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, key, value } = body;

    // Handle full database reset
    if (action === 'reset') {
      await db.delete(passengers);
      await db.delete(documents);
      await db.delete(memories);
      return NextResponse.json({ success: true, message: 'Database reset completed.' });
    }

    if (!key) {
      return NextResponse.json({ error: 'Key is required.' }, { status: 400 });
    }

    // Check if key exists
    const existing = await db.select().from(settings).where(eq(settings.key, key));

    if (existing.length > 0) {
      await db
        .update(settings)
        .set({ value: value || '', updatedAt: new Date() })
        .where(eq(settings.key, key));
    } else {
      await db
        .insert(settings)
        .values({ key, value: value || '', updatedAt: new Date() });
    }

    // If saving Gemini API key, update it globally in the process environment so memory functions pick it up immediately
    if (key === 'gemini_api_key' && value) {
      process.env.GEMINI_API_KEY = value;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to save settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
