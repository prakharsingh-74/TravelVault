import { NextResponse } from 'next/server';
import { askAssistant } from '@travelvault/memory';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (!query) {
      return NextResponse.json({ error: 'Query is required.' }, { status: 400 });
    }

    const response = await askAssistant(query);
    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('Failed to run AI assistant query:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
