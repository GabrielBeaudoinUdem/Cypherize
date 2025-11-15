import { NextResponse } from 'next/server';
import { resetDatabase } from '../../../../lib/kuzu-db';

export async function POST() {
  try {
    await resetDatabase();
    return NextResponse.json({ message: 'Database reset successfully.' });
  } catch (error) {
    console.error('Failed to reset database:', error);
    return NextResponse.json({ error: 'Failed to reset database.' }, { status: 500 });
  }
}