import { NextResponse } from 'next/server';
import { executeCypherQuery } from '../../lib/kuzu-db';

export async function POST(request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'requête est invalide' }, { status: 400 });
    }
    const result = await executeCypherQuery(query);
    return NextResponse.json({ result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}