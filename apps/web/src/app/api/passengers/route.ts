import { NextResponse } from 'next/server';
import { db, passengers } from '@travelvault/db';
import { indexPassenger } from '@travelvault/memory';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const data = await db.select().from(passengers);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      dob,
      gender,
      nationality,
      aadhaar,
      passport,
      mobile,
      email,
      preferredBerth,
      mealPreference
    } = body;

    if (!name || !dob || !gender || !nationality) {
      return NextResponse.json({ error: 'Name, DOB, Gender, and Nationality are required.' }, { status: 400 });
    }

    let result;

    if (id) {
      // Update passenger
      result = await db
        .update(passengers)
        .set({
          name,
          dob: new Date(dob),
          gender,
          nationality,
          aadhaar: aadhaar || null,
          passport: passport || null,
          mobile: mobile || null,
          email: email || null,
          preferredBerth: preferredBerth || null,
          mealPreference: mealPreference || null,
          updatedAt: new Date()
        })
        .where(eq(passengers.id, id))
        .returning();
    } else {
      // Create new passenger
      result = await db
        .insert(passengers)
        .values({
          name,
          dob: new Date(dob),
          gender,
          nationality,
          aadhaar: aadhaar || null,
          passport: passport || null,
          mobile: mobile || null,
          email: email || null,
          preferredBerth: preferredBerth || null,
          mealPreference: mealPreference || null,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
    }

    const savedPassenger = result[0];

    // Re-index passenger in semantic memory
    try {
      await indexPassenger({
        id: savedPassenger.id,
        name: savedPassenger.name,
        dob: savedPassenger.dob.toISOString().split('T')[0],
        gender: savedPassenger.gender,
        nationality: savedPassenger.nationality,
        aadhaar: savedPassenger.aadhaar,
        passport: savedPassenger.passport,
        mobile: savedPassenger.mobile,
        email: savedPassenger.email,
        preferredBerth: savedPassenger.preferredBerth,
        mealPreference: savedPassenger.mealPreference
      });
    } catch (indexError) {
      console.error('Failed to index passenger in semantic memory:', indexError);
    }

    return NextResponse.json(savedPassenger);
  } catch (error: any) {
    console.error('Failed to save passenger:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
