import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `És um assistente especializado em administração pública portuguesa. 
A tua missão é pesquisar informação oficial e atualizada de forma rigorosa.
Prioridade de fontes: SIOE (sioe.dgaep.gov.pt), Diário da República (dre.pt) e sites governamentais (.gov.pt).

Responde EXCLUSIVAMENTE em formato JSON puro, sem markdown, com esta estrutura:
{
  "entidades": [
    {
      "nome": "Nome completo oficial",
      "sigla": "Sigla (se existir)",
      "ministerio": "Ministério/Tutela atualizado",
      "missao": "Breve descrição da missão pública",
      "dirigentes": [ { "cargo": "Cargo oficial", "nome": "Nome completo", "desde": "Data de nomeação/posse" } ],
      "contactos": [ { "tipo": "Email/Telefone/Web", "valor": "valor" } ],
      "fonte": "Link oficial (preferencialmente SIOE ou DRE)"
    }
  ],
  "aviso": "Nota sobre a validade ou fonte dos dados"
}`;

export async function POST(request: Request) {
  try {
    const { termo } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Configuração incompleta: GEMINI_API_KEY em falta no Vercel.' }, { status: 500 });
    }

    // Atualizado para o modelo mais recente de alto desempenho (2.5-flash-preview ou equivalente 3.0)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ 
          parts: [{ text: `Pesquisa dados oficiais e atuais (especialmente no SIOE e Diário da República) sobre: "${termo}"` }] 
        }],
        tools: [{ google_search: {} }],
        generationConfig: { 
          responseMimeType: "application/json",
          temperature: 0.1 // Mantemos a temperatura baixa para maior rigor técnico
        }
      }),
    });

    const data = await response.json();
    
    // Gestão de limites (Rate Limit 429)
    if (response.status === 429) {
      return NextResponse.json({ error: 'Limite de pesquisa atingido. Aguarde um momento.' }, { status: 429 });
    }

    if (!response.ok) {
      throw new Error(data.error?.message || "Erro na comunicação com os servidores da Google.");
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("A IA não conseguiu encontrar resultados para esta pesquisa.");

    // Limpeza rigorosa para garantir que o JSON é válido
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const jsonParsed = JSON.parse(cleanText);
      return NextResponse.json(jsonParsed);
    } catch {
      // Tentativa de recuperação de JSON mal formatado
      const match = cleanText.match(/\{[\s\S]*\}/);
      if (match) return NextResponse.json(JSON.parse(match[0]));
      throw new Error("Erro ao processar o formato dos dados recebidos.");
    }

  } catch (error: any) {
    console.error("Erro Backend:", error);
    return NextResponse.json({ error: `Falha na Pesquisa: ${error.message}` }, { status: 500 });
  }
}
