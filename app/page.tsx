"use client";
import { useState, useEffect, useRef } from "react";

// ── Tipos ────────────────────────────────────────────────────────────────────
interface Contacto { tipo: string; valor: string; }
interface Dirigente { cargo: string; nome: string; desde: string; }
interface Entidade {
  nome: string; sigla: string; ministerio: string; missao: string;
  dirigentes: Dirigente[]; contactos: Contacto[];
  fonte: string; codigoSIOE: string;
}

// ── CopyButton ────────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{ background: "none", border: "1px solid #d0d0d0", borderRadius: 4, padding: "2px 8px", fontSize: 11, cursor: "pointer", color: copied ? "#1a6e3c" : "#666", marginLeft: 6 }}
    >
      {copied ? "✓" : "copiar"}
    </button>
  );
}

// ── EntidadeCard ──────────────────────────────────────────────────────────────
function EntidadeCard({ entidade }: { entidade: Entidade }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div style={{ background: "#fff", border: "1px solid #e0e4ea", borderRadius: 10, marginBottom: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "flex-start", justifyContent: "space-between", background: "linear-gradient(135deg,#f8f9fb,#f0f3f7)", borderBottom: expanded ? "1px solid #e0e4ea" : "none" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#1a2540", fontFamily: "Georgia,serif" }}>{entidade.nome}</span>
            {entidade.sigla && <span style={{ background: "#1a4d8f", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{entidade.sigla}</span>}
          </div>
          {entidade.ministerio && <div style={{ fontSize: 12, color: "#6b7a99", marginTop: 4, fontFamily: "monospace" }}>{entidade.ministerio}</div>}
        </div>
        <span style={{ fontSize: 18, color: "#999", marginLeft: 12 }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div style={{ padding: "16px 20px" }}>
          {entidade.missao && <p style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.6, margin: "0 0 16px 0", fontStyle: "italic" }}>{entidade.missao}</p>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {entidade.dirigentes?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1a4d8f", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>👤 Dirigentes</div>
                {entidade.dirigentes.map((d, i) => (
                  <div key={i} style={{ background: "#f7f9fc", border: "1px solid #e8ecf2", borderRadius: 6, padding: "10px 12px", marginBottom: 8 }}>
                    {d.nome ? <div style={{ fontWeight: 600, fontSize: 14, color: "#1a2540" }}>{d.nome}</div> : <div style={{ fontSize: 13, color: "#aaa", fontStyle: "italic" }}>Nome não disponível</div>}
                    <div style={{ fontSize: 12, color: "#6b7a99", marginTop: 2 }}>{d.cargo}</div>
                    {d.desde && <div style={{ fontSize: 11, color: "#aab", marginTop: 2 }}>desde {d.desde}</div>}
                  </div>
                ))}
              </div>
            )}

            {entidade.contactos?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1a6e3c", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>📞 Contactos</div>
                {entidade.contactos.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", padding: "8px 0", borderBottom: i < entidade.contactos.length - 1 ? "1px solid #f0f0f0" : "none", gap: 8 }}>
                    <span style={{ fontSize: 14, minWidth: 20, textAlign: "center" }}>
                      {c.tipo.toLowerCase().includes("email") ? "✉" : c.tipo.toLowerCase().includes("tel") ? "☎" : c.tipo.toLowerCase().includes("web") ? "🌐" : c.tipo.toLowerCase().includes("morada") ? "📍" : "•"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 0.5 }}>{c.tipo}</div>
                      <div style={{ fontSize: 13, color: "#1a2540", wordBreak: "break-all" }}>
                        {c.tipo.toLowerCase().includes("email") ? (
                          <a href={`mailto:${c.valor}`} style={{ color: "#1a4d8f", textDecoration: "none" }}>{c.valor}</a>
                        ) : c.tipo.toLowerCase().includes("web") ? (
                          <a href={c.valor.startsWith("http") ? c.valor : `https://${c.valor}`} target="_blank" rel="noreferrer" style={{ color: "#1a4d8f", textDecoration: "none" }}>{c.valor}</a>
                        ) : c.valor}
                        <CopyButton text={c.valor} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {entidade.fonte && (
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #f0f0f0" }}>
              <span style={{ fontSize: 11, color: "#aaa" }}>Fonte: </span>
              <a href={entidade.fonte} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#1a4d8f" }}>{entidade.fonte}</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── App principal ─────────────────────────────────────────────────────────────
const SUGESTOES = ["AICEP", "Agência para a Modernização Administrativa", "Instituto Nacional de Estatística", "Direção-Geral da Saúde", "Autoridade Tributária", "IEFP"];

export default function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<Entidade[] | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [historico, setHistorico] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    if (cooldown > 0) { const t = setTimeout(() => setCooldown(c => c - 1), 1000); return () => clearTimeout(t); }
  }, [cooldown]);

  async function pesquisar(q?: string) {
    const termo = q || query;
    if (!termo.trim() || cooldown > 0) return;
    setLoading(true); setErro(null); setResultado(null); setAviso(null);
    setHistorico(h => [termo, ...h.filter(x => x !== termo)].slice(0, 6));

    try {
      const res = await fetch("/api/pesquisa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ termo }) });
      const data = await res.json();
      if (res.status === 429) { setCooldown(30); throw new Error(`Limite atingido. Aguarda ${data.retryAfter || 30}s.`); }
      if (!res.ok) throw new Error(data.error || "Erro na pesquisa.");
      setResultado(data.entidades || []);
      setAviso(data.aviso || null);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#f0f4fa,#e8eef7)", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#1a2f5e", color: "#fff", padding: "20px 24px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
        <div style={{ width: 38, height: 38, background: "linear-gradient(135deg,#c8102e 50%,#006600 50%)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🔎</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3, fontFamily: "Georgia,serif" }}>Diretório de Dirigentes Públicos</div>
          <div style={{ fontSize: 12, color: "#a0b0cc", marginTop: 1 }}>Pesquisa local · Dados do SIOE · Atualizado semanalmente</div>
        </div>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 20px" }}>
        {/* Caixa de pesquisa */}
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", padding: 24, marginBottom: 28 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && pesquisar()}
              placeholder="Ex: Direção-Geral da Saúde, AICEP, ANAC..."
              style={{ flex: 1, padding: "12px 16px", fontSize: 15, border: "2px solid #e0e4ea", borderRadius: 8, outline: "none", fontFamily: "inherit" }}
              onFocus={e => (e.target.style.borderColor = "#1a4d8f")}
              onBlur={e => (e.target.style.borderColor = "#e0e4ea")}
            />
            <button
              onClick={() => pesquisar()}
              disabled={loading || cooldown > 0 || !query.trim()}
              style={{ background: loading || cooldown > 0 ? "#aaa" : "#1a2f5e", color: "#fff", border: "none", borderRadius: 8, padding: "12px 22px", fontSize: 14, fontWeight: 600, cursor: loading || cooldown > 0 ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
            >
              {loading ? "A pesquisar…" : cooldown > 0 ? `Aguarda ${cooldown}s` : "Pesquisar"}
            </button>
          </div>

          {!resultado && !loading && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: "#999", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Pesquisas rápidas</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {SUGESTOES.map(s => (
                  <button key={s} onClick={() => { setQuery(s); pesquisar(s); }}
                    style={{ background: "#f0f4fa", border: "1px solid #dce3ee", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#3a5080", cursor: "pointer", fontFamily: "inherit" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {historico.length > 0 && !loading && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: "#bbb", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Recentes</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {historico.map(h => (
                  <button key={h} onClick={() => { setQuery(h); pesquisar(h); }}
                    style={{ background: "none", border: "1px dashed #ccc", borderRadius: 20, padding: "4px 10px", fontSize: 11, color: "#888", cursor: "pointer", fontFamily: "inherit" }}>
                    ↩ {h}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12, display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</div>
            <div style={{ fontSize: 14, color: "#6b7a99" }}>A pesquisar na base SIOE…</div>
            <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* Aviso */}
        {aviso && (
          <div style={{ background: "#fffbea", border: "1px solid #f5d050", borderRadius: 8, padding: "10px 16px", color: "#7a6000", fontSize: 12, marginBottom: 16 }}>
            ℹ {aviso}
          </div>
        )}

        {/* Erro */}
        {erro && (
          <div style={{ background: "#fff5f5", border: "1px solid #fcc", borderRadius: 8, padding: "14px 18px", color: "#c00", fontSize: 14 }}>
            ⚠ {erro}
            {erro.includes("workflow") && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
                Vai ao GitHub → separador <strong>Actions</strong> → <strong>Atualizar base SIOE</strong> → <strong>Run workflow</strong>
              </div>
            )}
          </div>
        )}

        {/* Sem resultados */}
        {resultado && resultado.length === 0 && (
          <div style={{ textAlign: "center", padding: "50px 0", color: "#999", fontSize: 14 }}>
            Nenhum resultado encontrado.<br />
            <span style={{ fontSize: 12 }}>Tenta com o nome completo ou sigla oficial.</span>
          </div>
        )}

        {/* Resultados */}
        {resultado && resultado.map((e, i) => <EntidadeCard key={i} entidade={e} />)}

        <div style={{ textAlign: "center", marginTop: 32, fontSize: 11, color: "#bbb" }}>
          Dados SIOE · DGAEP · Atualizado automaticamente toda segunda-feira
        </div>
      </div>
    </div>
  );
}
