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
    const { action, key, value, settings: settingsList } = body;

    // Handle full database reset
    if (action === 'reset') {
      await db.delete(passengers);
      await db.delete(documents);
      await db.delete(memories);
      return NextResponse.json({ success: true, message: 'Database reset completed.' });
    }

    // Support batch saving of multiple settings keys
    if (settingsList && typeof settingsList === 'object') {
      for (const [k, v] of Object.entries(settingsList)) {
        const valStr = String(v || '');
        const existing = await db.select().from(settings).where(eq(settings.key, k));
        
        if (existing.length > 0) {
          await db
            .update(settings)
            .set({ value: valStr, updatedAt: new Date() })
            .where(eq(settings.key, k));
        } else {
          await db
            .insert(settings)
            .values({ key: k, value: valStr, updatedAt: new Date() });
        }

        // Keep process environment in sync
        if (k === 'gemini_api_key') {
          process.env.GEMINI_API_KEY = valStr;
        } else if (k === 'groq_api_key') {
          process.env.GROQ_API_KEY = valStr;
        }
      }
      return NextResponse.json({ success: true });
    }

    // Single key-value pair fallback
    if (!key) {
      return NextResponse.json({ error: 'Key or settings object is required.' }, { status: 400 });
    }

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

    // Sync process env
    if (key === 'gemini_api_key') {
      process.env.GEMINI_API_KEY = value || '';
    } else if (key === 'groq_api_key') {
      process.env.GROQ_API_KEY = value || '';
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to save settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
