import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `És um assistente especializado em administração pública portuguesa. Devolve SEMPRE APENAS um objeto JSON válido com esta estrutura:
{
  "entidades": [
    {
      "nome": "Nome da entidade",
      "sigla": "Sigla se existir",
      "ministerio": "Ministério/tutela",
      "missao": "Descrição breve da missão",
      "dirigentes": [ { "cargo": "Ex: Presidente", "nome": "Nome completo", "desde": "Data ou vazio" } ],
      "contactos": [ { "tipo": "Email / Telefone / Website", "valor": "contacto" } ],
      "fonte": "URL da fonte"
    }
  ],
  "aviso": "Nota se aplicável"
}`;

export async function POST(request: Request) {
  try {
    const { termo } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Falta a GEMINI_API_KEY no Vercel!' }, { status: 400 });
    }

    // AQUI ESTÁ A CORREÇÃO: Mudámos para gemini-2.5-flash
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: `Pesquisa informação atualizada sobre: "${termo}"` }] }],
        tools: [{ google_search: {} }], // Liga a pesquisa na Internet
        generationConfig: { responseMimeType: "application/json" }
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ error: `Erro do Google: ${data.error?.message || 'Desconhecido'}` }, { status: 500 });
    }

    const text = data.candidates[0].content.parts[0].text;
    
    // Limpar o texto
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonParsed = JSON.parse(cleanText);

    return NextResponse.json(jsonParsed);

  } catch (error: any) {
    return NextResponse.json({ error: `Erro Interno: ${error.message}` }, { status: 500 });
  }
}