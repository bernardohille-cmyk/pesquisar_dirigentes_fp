import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `És um assistente especializado em administração pública portuguesa. Quando o utilizador pesquisar por um dirigente, entidade ou organismo público português:
Pesquisa nas tuas fontes. Devolve SEMPRE APENAS um objeto JSON válido com esta estrutura exata:
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
      return NextResponse.json({ error: 'Chave da API não configurada no Vercel.' }, { status: 500 });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: `Pesquisa informação atualizada sobre: "${termo}". Inclui dirigentes atuais, contactos e tutela.` }] }],
        tools: [{ google_search: {} }],
        generationConfig: { responseMimeType: "application/json" }
      }),
    });

    const data = await response.json();
    
    if (!response.ok) throw new Error(data.error?.message || "Erro na API do Google");

    const text = data.candidates[0].content.parts[0].text;
    const jsonParsed = JSON.parse(text);

    return NextResponse.json(jsonParsed);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Erro ao processar os dados.' }, { status: 500 });
  }
}