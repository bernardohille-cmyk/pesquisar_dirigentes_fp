diff --git a/app/page.tsx b/app/page.tsx
new file mode 100644
index 0000000000000000000000000000000000000000..373dd322e4ac6a5af9dc7aacbbb752c5b50d9328
--- /dev/null
+++ b/app/page.tsx
@@ -0,0 +1,354 @@
+"use client";
+
+import { useEffect, useRef, useState } from "react";
+
+type Dirigente = {
+  cargo?: string;
+  nome?: string;
+  desde?: string;
+};
+
+type Contacto = {
+  tipo?: string;
+  valor?: string;
+};
+
+type Entidade = {
+  nome?: string;
+  sigla?: string;
+  ministerio?: string;
+  missao?: string;
+  dirigentes?: Dirigente[];
+  contactos?: Contacto[];
+  fonte?: string;
+};
+
+const sugestoes = [
+  "AICEP Portugal Global",
+  "Agência para a Modernização Administrativa",
+  "Instituto Nacional de Estatística",
+  "Direção-Geral da Saúde",
+  "Autoridade Tributária e Aduaneira",
+  "Instituto do Emprego e Formação Profissional",
+  "Agência para a Integração, Migrações e Asilo",
+];
+
+function CopyButton({ text }: { text: string }) {
+  const [copied, setCopied] = useState(false);
+
+  async function handleCopy() {
+    try {
+      await navigator.clipboard.writeText(text || "");
+      setCopied(true);
+      setTimeout(() => setCopied(false), 1500);
+    } catch {
+      // silent fallback
+    }
+  }
+
+  return (
+    <button
+      onClick={handleCopy}
+      style={{
+        background: "none",
+        border: "1px solid #d0d0d0",
+        borderRadius: 4,
+        padding: "2px 8px",
+        fontSize: 11,
+        cursor: "pointer",
+        color: copied ? "#1a6e3c" : "#666",
+        marginLeft: 6,
+      }}
+      type="button"
+    >
+      {copied ? "✓" : "copiar"}
+    </button>
+  );
+}
+
+function ContactoIcon({ tipo = "" }: { tipo?: string }) {
+  const t = tipo.toLowerCase();
+  if (t.includes("email")) return "✉";
+  if (t.includes("telefone") || t.includes("tel")) return "☎";
+  if (t.includes("web") || t.includes("site")) return "🌐";
+  if (t.includes("morada")) return "📍";
+  return "•";
+}
+
+function EntidadeCard({ entidade }: { entidade: Entidade }) {
+  const [expanded, setExpanded] = useState(true);
+
+  return (
+    <div
+      style={{
+        background: "#fff",
+        border: "1px solid #e0e4ea",
+        borderRadius: 10,
+        marginBottom: 16,
+        overflow: "hidden",
+        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
+      }}
+    >
+      <button
+        onClick={() => setExpanded((v) => !v)}
+        type="button"
+        style={{
+          width: "100%",
+          padding: "16px 20px",
+          cursor: "pointer",
+          display: "flex",
+          alignItems: "flex-start",
+          justifyContent: "space-between",
+          background: "linear-gradient(135deg, #f8f9fb 0%, #f0f3f7 100%)",
+          border: "none",
+          borderBottom: expanded ? "1px solid #e0e4ea" : "none",
+          textAlign: "left",
+        }}
+      >
+        <div style={{ flex: 1 }}>
+          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
+            <span style={{ fontSize: 17, fontWeight: 700, color: "#1a2540", fontFamily: "'Georgia', serif" }}>
+              {entidade.nome || "Entidade sem nome"}
+            </span>
+            {entidade.sigla && (
+              <span
+                style={{
+                  background: "#1a4d8f",
+                  color: "#fff",
+                  fontSize: 11,
+                  fontWeight: 700,
+                  padding: "2px 8px",
+                  borderRadius: 20,
+                }}
+              >
+                {entidade.sigla}
+              </span>
+            )}
+          </div>
+          {entidade.ministerio && (
+            <div style={{ fontSize: 12, color: "#6b7a99", marginTop: 4, fontFamily: "monospace" }}>{entidade.ministerio}</div>
+          )}
+        </div>
+        <span style={{ fontSize: 18, color: "#999", marginLeft: 12 }}>{expanded ? "▲" : "▼"}</span>
+      </button>
+
+      {expanded && (
+        <div style={{ padding: "16px 20px" }}>
+          {entidade.missao && (
+            <p style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.6, margin: "0 0 16px", fontStyle: "italic" }}>{entidade.missao}</p>
+          )}
+
+          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
+            {(entidade.dirigentes?.length ?? 0) > 0 && (
+              <div>
+                <div style={{ fontSize: 11, fontWeight: 700, color: "#1a4d8f", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
+                  👤 Dirigentes
+                </div>
+                {entidade.dirigentes?.map((d, i) => (
+                  <div key={`${d.nome}-${i}`} style={{ background: "#f7f9fc", border: "1px solid #e8ecf2", borderRadius: 6, padding: "10px 12px", marginBottom: 8 }}>
+                    <div style={{ fontWeight: 600, fontSize: 14, color: "#1a2540" }}>{d.nome || "Nome não disponível"}</div>
+                    <div style={{ fontSize: 12, color: "#6b7a99", marginTop: 2 }}>{d.cargo || "Cargo não indicado"}</div>
+                    {d.desde && <div style={{ fontSize: 11, color: "#aab", marginTop: 2 }}>desde {d.desde}</div>}
+                  </div>
+                ))}
+              </div>
+            )}
+
+            {(entidade.contactos?.length ?? 0) > 0 && (
+              <div>
+                <div style={{ fontSize: 11, fontWeight: 700, color: "#1a6e3c", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
+                  📞 Contactos
+                </div>
+                {entidade.contactos?.map((c, i) => {
+                  const tipo = c.tipo || "Contacto";
+                  const valor = c.valor || "";
+                  const lower = tipo.toLowerCase();
+
+                  return (
+                    <div
+                      key={`${tipo}-${i}`}
+                      style={{ display: "flex", alignItems: "flex-start", padding: "8px 0", borderBottom: i < (entidade.contactos?.length || 0) - 1 ? "1px solid #f0f0f0" : "none", gap: 8 }}
+                    >
+                      <span style={{ fontSize: 14, minWidth: 20, textAlign: "center" }}>
+                        <ContactoIcon tipo={tipo} />
+                      </span>
+                      <div style={{ flex: 1 }}>
+                        <div style={{ fontSize: 10, fontWeight: 700, color: "#999", textTransform: "uppercase" }}>{tipo}</div>
+                        <div style={{ fontSize: 13, color: "#1a2540", wordBreak: "break-all" }}>
+                          {lower.includes("email") ? (
+                            <a href={`mailto:${valor}`} style={{ color: "#1a4d8f", textDecoration: "none" }}>{valor}</a>
+                          ) : lower.includes("web") || lower.includes("site") ? (
+                            <a href={valor.startsWith("http") ? valor : `https://${valor}`} target="_blank" rel="noreferrer" style={{ color: "#1a4d8f", textDecoration: "none" }}>
+                              {valor}
+                            </a>
+                          ) : (
+                            valor
+                          )}
+                          {valor && <CopyButton text={valor} />}
+                        </div>
+                      </div>
+                    </div>
+                  );
+                })}
+              </div>
+            )}
+          </div>
+
+          {entidade.fonte && (
+            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #f0f0f0" }}>
+              <span style={{ fontSize: 11, color: "#aaa" }}>Fonte: </span>
+              <a href={entidade.fonte} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#1a4d8f" }}>
+                {entidade.fonte}
+              </a>
+            </div>
+          )}
+        </div>
+      )}
+    </div>
+  );
+}
+
+export default function App() {
+  const [query, setQuery] = useState("");
+  const [loading, setLoading] = useState(false);
+  const [resultado, setResultado] = useState<Entidade[] | null>(null);
+  const [aviso, setAviso] = useState<string | null>(null);
+  const [erro, setErro] = useState<string | null>(null);
+  const [historico, setHistorico] = useState<string[]>([]);
+  const inputRef = useRef<HTMLInputElement>(null);
+
+  useEffect(() => {
+    inputRef.current?.focus();
+  }, []);
+
+  async function pesquisar(q?: string) {
+    const termo = (q || query).trim();
+    if (!termo || loading) return;
+
+    setLoading(true);
+    setResultado(null);
+    setErro(null);
+    setAviso(null);
+    setHistorico((h) => [termo, ...h.filter((x) => x !== termo)].slice(0, 6));
+
+    try {
+      const response = await fetch("/api/pesquisa", {
+        method: "POST",
+        headers: { "Content-Type": "application/json" },
+        body: JSON.stringify({ termo }),
+      });
+
+      const data = await response.json().catch(() => ({}));
+      if (!response.ok) {
+        throw new Error(data?.error || `Erro da API (${response.status})`);
+      }
+
+      setResultado(Array.isArray(data.entidades) ? data.entidades : []);
+      setAviso(typeof data.aviso === "string" ? data.aviso : null);
+    } catch (e) {
+      setErro(e instanceof Error ? e.message : "Erro inesperado ao pesquisar.");
+    } finally {
+      setLoading(false);
+    }
+  }
+
+  return (
+    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #f0f4fa 0%, #e8eef7 100%)", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
+      <div style={{ background: "#1a2f5e", color: "#fff", padding: "20px 24px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
+        <div style={{ width: 38, height: 38, background: "linear-gradient(135deg, #c8102e 50%, #006600 50%)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
+          🔎
+        </div>
+        <div>
+          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3, fontFamily: "'Georgia', serif" }}>Diretório de Dirigentes Públicos</div>
+          <div style={{ fontSize: 12, color: "#a0b0cc", marginTop: 1 }}>Pesquisa em tempo real · Fontes oficiais</div>
+        </div>
+      </div>
+
+      <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 20px" }}>
+        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", padding: 24, marginBottom: 28 }}>
+          <div style={{ display: "flex", gap: 10 }}>
+            <input
+              ref={inputRef}
+              value={query}
+              onChange={(e) => setQuery(e.target.value)}
+              onKeyDown={(e) => e.key === "Enter" && pesquisar()}
+              placeholder="Ex: Direção-Geral da Saúde, AICEP, Ana Paula Zacarias..."
+              style={{ flex: 1, padding: "12px 16px", fontSize: 15, border: "2px solid #e0e4ea", borderRadius: 8, outline: "none" }}
+            />
+            <button
+              onClick={() => pesquisar()}
+              disabled={loading || !query.trim()}
+              type="button"
+              style={{ background: loading ? "#aaa" : "#1a2f5e", color: "#fff", border: "none", borderRadius: 8, padding: "12px 22px", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
+            >
+              {loading ? "A pesquisar…" : "Pesquisar"}
+            </button>
+          </div>
+
+          {!resultado && !loading && (
+            <div style={{ marginTop: 16 }}>
+              <div style={{ fontSize: 11, color: "#999", marginBottom: 8, textTransform: "uppercase" }}>Pesquisas rápidas</div>
+              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
+                {sugestoes.map((s) => (
+                  <button
+                    key={s}
+                    onClick={() => {
+                      setQuery(s);
+                      pesquisar(s);
+                    }}
+                    type="button"
+                    style={{ background: "#f0f4fa", border: "1px solid #dce3ee", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#3a5080", cursor: "pointer" }}
+                  >
+                    {s}
+                  </button>
+                ))}
+              </div>
+            </div>
+          )}
+
+          {historico.length > 0 && !loading && (
+            <div style={{ marginTop: 12 }}>
+              <div style={{ fontSize: 11, color: "#bbb", marginBottom: 6, textTransform: "uppercase" }}>Recentes</div>
+              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
+                {historico.map((h) => (
+                  <button
+                    key={h}
+                    onClick={() => {
+                      setQuery(h);
+                      pesquisar(h);
+                    }}
+                    type="button"
+                    style={{ background: "none", border: "1px dashed #ccc", borderRadius: 20, padding: "4px 10px", fontSize: 11, color: "#888", cursor: "pointer" }}
+                  >
+                    ↩ {h}
+                  </button>
+                ))}
+              </div>
+            </div>
+          )}
+        </div>
+
+        {loading && (
+          <div style={{ textAlign: "center", padding: "60px 0" }}>
+            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
+            <div style={{ fontSize: 14, color: "#6b7a99" }}>A consultar fontes oficiais…</div>
+          </div>
+        )}
+
+        {erro && <div style={{ background: "#fff5f5", border: "1px solid #fcc", borderRadius: 8, padding: "14px 18px", color: "#c00", fontSize: 14 }}>⚠ {erro}</div>}
+
+        {aviso && <div style={{ background: "#fffbea", border: "1px solid #f5d050", borderRadius: 8, padding: "10px 16px", color: "#7a6000", fontSize: 12, marginBottom: 16 }}>ℹ {aviso}</div>}
+
+        {resultado && resultado.length === 0 && (
+          <div style={{ textAlign: "center", padding: "50px 0", color: "#999", fontSize: 14 }}>
+            Nenhum resultado encontrado para esta pesquisa.
+          </div>
+        )}
+
+        {resultado && resultado.map((e, i) => <EntidadeCard key={`${e.nome}-${i}`} entidade={e} />)}
+
+        <div style={{ textAlign: "center", marginTop: 32, fontSize: 11, color: "#bbb" }}>Dados consultados em tempo real a partir de fontes públicas oficiais.</div>
+      </div>
+    </div>
+  );
+}
