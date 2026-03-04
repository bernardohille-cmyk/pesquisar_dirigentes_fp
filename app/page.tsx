"use client";
import { useState, useEffect } from "react";

// Reaproveita os teus componentes (EntidadeCard, CopyButton, etc.) aqui...

export default function App() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Lógica do cronómetro de bloqueio
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  async function pesquisar(q?: string) {
    const termo = q || query;
    if (!termo.trim() || cooldown > 0) return;

    setLoading(true); setErro(null); setResultado(null);
    
    try {
      const response = await fetch("/api/pesquisa", {
        method: "POST",
        body: JSON.stringify({ termo }),
      });

      const data = await response.json();

      if (response.status === 429) {
        setCooldown(30); // Bloqueia por 30 segundos como na tua imagem
        throw new Error(`Limite atingido. Tenta de novo em ${data.retryAfter || 30}s.`);
      }

      if (!response.ok) throw new Error(data.error || "Erro na pesquisa.");
      setResultado(data.entidades || []);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 20 }}>
      {/* Input e Botão */}
      <div style={{ display: "flex", gap: 10 }}>
        <input 
          value={query} 
          onChange={e => setQuery(e.target.value)}
          placeholder="Pesquisar entidade..."
          style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #ccc" }}
        />
        <button 
          onClick={() => pesquisar()} 
          disabled={loading || cooldown > 0}
          style={{ 
            padding: "12px 20px", 
            backgroundColor: cooldown > 0 ? "#ccc" : "#1a2f5e",
            color: "#fff", borderRadius: 8, cursor: "pointer" 
          }}
        >
          {loading ? "A pesquisar..." : cooldown > 0 ? `Aguarde ${cooldown}s` : "Pesquisar"}
        </button>
      </div>

      {erro && <div style={{ color: "red", marginTop: 10 }}>⚠️ {erro}</div>}
      
      {/* Lista de resultados (mapear EntidadeCard aqui) */}
      {resultado && resultado.map((ent: any, i: number) => (
        <div key={i} style={{ marginTop: 20 }}>{ent.nome} - {ent.ministerio}</div>
      ))}
    </div>
  );
}