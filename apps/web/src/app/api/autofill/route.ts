import { NextResponse } from 'next/server';
import { db, passengers } from '@travelvault/db';
import { getRulesForUrl, calculateAge } from '@travelvault/autofill';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { url, passengerId } = await request.json();
    if (!url || !passengerId) {
      return NextResponse.json({ error: 'URL and Passenger ID are required.' }, { status: 400 });
    }

    const passengerData = await db.select().from(passengers).where(eq(passengers.id, passengerId));
    if (passengerData.length === 0) {
      return NextResponse.json({ error: 'Passenger not found.' }, { status: 404 });
    }

    const p = passengerData[0];
    const rules = getRulesForUrl(url);

    const mappedFields: Array<{ selector: string; value: string; type: string }> = [];

    // Map Name
    if (rules.fields.name && p.name) {
      rules.fields.name.forEach((rule) => {
        mappedFields.push({ selector: rule.selector, value: p.name, type: rule.type });
      });
    }

    // Map Age
    if (rules.fields.age && p.dob) {
      const age = calculateAge(p.dob);
      rules.fields.age.forEach((rule) => {
        mappedFields.push({ selector: rule.selector, value: age.toString(), type: rule.type });
      });
    }

    // Map Gender
    if (rules.fields.gender && p.gender) {
      rules.fields.gender.forEach((rule) => {
        // Normalize gender value (e.g. MALE -> M or Male depending on select options)
        const genderVal = p.gender.toUpperCase();
        let value = p.gender;
        if (genderVal.startsWith('M')) {
          value = 'M'; // Standard abbreviation often used in IRCTC dropdowns
        } else if (genderVal.startsWith('F')) {
          value = 'F';
        }
        mappedFields.push({ selector: rule.selector, value, type: rule.type });
      });
    }

    // Map Berth Preference
    if (rules.fields.berth && p.preferredBerth) {
      rules.fields.berth.forEach((rule) => {
        mappedFields.push({ selector: rule.selector, value: p.preferredBerth || '', type: rule.type });
      });
    }

    // Map Seat Preference
    if (rules.fields.seat && p.preferredSeat) {
      rules.fields.seat.forEach((rule) => {
        mappedFields.push({ selector: rule.selector, value: p.preferredSeat || '', type: rule.type });
      });
    }

    // Map Meal Preference
    if (rules.fields.meal && p.mealPreference) {
      rules.fields.meal.forEach((rule) => {
        mappedFields.push({ selector: rule.selector, value: p.mealPreference || '', type: rule.type });
      });
    }

    // Map Mobile
    if (rules.fields.mobile && p.mobile) {
      rules.fields.mobile.forEach((rule) => {
        mappedFields.push({ selector: rule.selector, value: p.mobile || '', type: rule.type });
      });
    }

    // Map Email
    if (rules.fields.email && p.email) {
      rules.fields.email.forEach((rule) => {
        mappedFields.push({ selector: rule.selector, value: p.email || '', type: rule.type });
      });
    }

    return NextResponse.json({ fields: mappedFields });
  } catch (error: any) {
    console.error('Failed to generate autofill fields:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
