import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `És um assistente especializado em administração pública portuguesa. 
Pesquisa no SIOE (sioe.dgaep.gov.pt) e Diário da República (dre.pt).
Responde APENAS em JSON puro com esta estrutura:
{
  "entidades": [{
    "nome": "string", "sigla": "string", "ministerio": "string", 
    "missao": "string", "dirigentes": [{"cargo": "string", "nome": "string", "desde": "string"}],
    "contactos": [{"tipo": "string", "valor": "string"}],
    "fonte": "url"
  }],
  "aviso": "string"
}`;

export async function POST(request: Request) {
  try {
    const { termo } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: 'Erro: GEMINI_API_KEY não configurada.' }, { status: 500 });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: `Dados oficiais sobre: "${termo}"` }] }],
        tools: [{ google_search: {} }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
      }),
    });

    if (response.status === 429) {
      return NextResponse.json({ error: 'Limite atingido.', retryAfter: 30 }, { status: 429 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return NextResponse.json(JSON.parse(text || "{}"));
  } catch (error: any) {
    return NextResponse.json({ error: 'Falha na comunicação com a IA.' }, { status: 500 });
  }
}