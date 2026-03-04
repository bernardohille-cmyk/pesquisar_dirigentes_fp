diff --git a/app/api/pesquisa/route.ts b/app/api/pesquisa/route.ts
new file mode 100644
index 0000000000000000000000000000000000000000..4ca1e0c097eab26b78f9dd51e5932a2b3e3856f1
--- /dev/null
+++ b/app/api/pesquisa/route.ts
@@ -0,0 +1,144 @@
+import { NextResponse } from "next/server";
+
+const SYSTEM_PROMPT = `És um assistente especializado em administração pública portuguesa.
+Prioriza fontes oficiais: SIOE (sioe.dgaep.gov.pt), Diário da República (dre.pt), Portal do Governo (portugal.gov.pt) e outros domínios oficiais .gov.pt.
+
+Responde APENAS com JSON válido (sem markdown), na estrutura:
+{
+  "entidades": [
+    {
+      "nome": "Nome da entidade",
+      "sigla": "Sigla se existir",
+      "ministerio": "Ministério/tutela",
+      "missao": "Descrição breve da missão",
+      "dirigentes": [
+        { "cargo": "Cargo", "nome": "Nome completo", "desde": "Data ou vazio" }
+      ],
+      "contactos": [
+        { "tipo": "Email / Telefone / Website / Morada", "valor": "contacto" }
+      ],
+      "fonte": "URL oficial"
+    }
+  ],
+  "aviso": "Nota sobre atualidade/limitações"
+}
+
+Nunca inventes contactos. Se não souberes, deixa campo vazio.`;
+
+type PesquisaResponse = {
+  entidades?: unknown;
+  aviso?: unknown;
+};
+
+function safeJsonExtract(raw: string): PesquisaResponse | null {
+  try {
+    return JSON.parse(raw);
+  } catch {
+    // no-op
+  }
+
+  const withoutFences = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
+  try {
+    return JSON.parse(withoutFences);
+  } catch {
+    // no-op
+  }
+
+  const match = withoutFences.match(/\{[\s\S]*\}/);
+  if (!match) return null;
+
+  try {
+    return JSON.parse(match[0]);
+  } catch {
+    return null;
+  }
+}
+
+function normalisePayload(payload: PesquisaResponse) {
+  return {
+    entidades: Array.isArray(payload?.entidades) ? payload.entidades : [],
+    aviso: typeof payload?.aviso === "string" ? payload.aviso : null,
+  };
+}
+
+async function wait(ms: number) {
+  await new Promise((resolve) => setTimeout(resolve, ms));
+}
+
+export async function POST(request: Request) {
+  try {
+    const body = await request.json().catch(() => null);
+    const termo = typeof body?.termo === "string" ? body.termo.trim() : "";
+
+    if (!termo || termo.length < 2) {
+      return NextResponse.json({ error: "Termo de pesquisa inválido." }, { status: 400 });
+    }
+
+    const apiKey = process.env.GEMINI_API_KEY;
+    if (!apiKey) {
+      return NextResponse.json({ error: "Configuração em falta: GEMINI_API_KEY." }, { status: 500 });
+    }
+
+    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
+
+    const makeRequest = async () =>
+      fetch(endpoint, {
+        method: "POST",
+        headers: { "Content-Type": "application/json" },
+        body: JSON.stringify({
+          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
+          contents: [
+            {
+              parts: [
+                {
+                  text: `Pesquisa informação atualizada sobre: "${termo}". Usa prioritariamente SIOE, DRE e portais oficiais. Responde só em JSON válido.`,
+                },
+              ],
+            },
+          ],
+          tools: [{ google_search: {} }],
+          generationConfig: {
+            temperature: 0.1,
+            responseMimeType: "application/json",
+          },
+        }),
+      });
+
+    let response = await makeRequest();
+    if (response.status === 429) {
+      const retryAfter = Number(response.headers.get("retry-after") ?? "0");
+      const delayMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1500;
+      await wait(delayMs);
+      response = await makeRequest();
+    }
+
+    const data = await response.json().catch(() => ({}));
+
+    if (response.status === 429) {
+      return NextResponse.json(
+        { error: "Limite temporário atingido. Aguarda 1 minuto e tenta novamente." },
+        { status: 429 },
+      );
+    }
+
+    if (!response.ok) {
+      const msg = data?.error?.message || "Falha na comunicação com o provedor de IA.";
+      return NextResponse.json({ error: msg }, { status: 502 });
+    }
+
+    const text = data?.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => typeof p?.text === "string")?.text;
+    if (!text) {
+      return NextResponse.json({ error: "Resposta vazia da IA." }, { status: 502 });
+    }
+
+    const parsed = safeJsonExtract(text);
+    if (!parsed) {
+      return NextResponse.json({ error: "A IA respondeu num formato inválido." }, { status: 502 });
+    }
+
+    return NextResponse.json(normalisePayload(parsed));
+  } catch (error) {
+    const message = error instanceof Error ? error.message : "Erro interno.";
+    return NextResponse.json({ error: `Erro interno: ${message}` }, { status: 500 });
+  }
+}
