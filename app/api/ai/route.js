import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Récupérer config
    const { config, prompt } = await request.json();
    if (!config || !config.url || !config.model || !prompt) {
      return NextResponse.json({ error: 'Configuration ou message manquant.' }, { status: 400 });
    }

    // préparer payload
    const payload = {
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      stream: false,
    };

    // faire le call
    const externalResponse = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // gérer les erreurs
    if (!externalResponse.ok) {
      const errorBody = await externalResponse.text();
      console.error("Erreur de l'API externe:", errorBody);
      return NextResponse.json(
        { error: `L'API externe a répondu avec le statut ${externalResponse.status}.` },
        { status: externalResponse.status }
      );
    }

    // renvoyer la réponse
    const data = await externalResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Erreur interne dans /api/ai:", error);
    return NextResponse.json({ error: "Erreur lors de la communication avec le service IA." }, { status: 500 });
  }
}