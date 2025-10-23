import { NextResponse } from 'next/server';
import { getDbSchema } from '../../../lib/kuzu-db';

export async function GET() {
  try {
    const schema = await getDbSchema();
    return NextResponse.json(schema);
  } catch (error) {
    console.error('Erreur lors de la récupération du schéma:', error);
    return NextResponse.json({ error: 'Impossible de récupérer le schéma de la base de données.' }, { status: 500 });
  }
}