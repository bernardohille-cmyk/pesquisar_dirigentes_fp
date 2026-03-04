import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `És um assistente especializado em administração pública portuguesa. 
Devolve SEMPRE e APENAS um objeto JSON válido. NÃO escrevas mais nenhum texto. NÃO uses formatação markdown. 
Estrutura:
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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: `Pesquisa informação atualizada na internet sobre: "${termo}"` }] }],
        // Mantemos a pesquisa na net:
        tools: [{ google_search: {} }] 
        // APAGÁMOS A LINHA QUE ESTAVA A DAR O ERRO DO JSON!
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ error: `Erro do Google: ${data.error?.message || 'Desconhecido'}` }, { status: 500 });
    }

    const text = data.candidates[0].content.parts[0].text;
    
    // O nosso próprio código limpa o formato para garantir que não há erros
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const jsonParsed = JSON.parse(cleanText);
      return NextResponse.json(jsonParsed);
    } catch (parseError) {
       // Se o Google teimar em não mandar JSON, usamos fallback
       const match = cleanText.match(/\{[\s\S]*\}/);
       if(match) return NextResponse.json(JSON.parse(match[0]));
       throw new Error("O Google não devolveu os dados no formato correto.");
    }

  } catch (error: any) {
    return NextResponse.json({ error: `Erro: ${error.message}` }, { status: 500 });
  }
}