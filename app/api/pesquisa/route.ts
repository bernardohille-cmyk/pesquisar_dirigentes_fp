import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Contacto { tipo: string; valor: string; }
interface Dirigente { orgao: string; cargo: string; nome: string; desde: string; }
interface Entidade {
  codigoSIOE: string;
  designacao: string;
  sigla: string;
  missao?: string;
  ministerio?: string;
  website?: string;
  morada?: string;
  contactos: Contacto[];
  dirigentes: Dirigente[];
}
interface SioeDados {
  meta: { geradoEm: string; totalEntidades: number };
  entidades: Entidade[];
}

// ── Carregar dados ─────────────────────────────────────────────────────────────

function carregarDados(): SioeDados | null {
  try {
    const file = path.join(process.cwd(), 'data', 'sioe.json');
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
}

// ── Pesquisa local ─────────────────────────────────────────────────────────────

function normalizar(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function score(e: Entidade, termo: string): number {
  const campos = [
    e.designacao, e.sigla, e.missao || '', e.ministerio || '',
    ...e.dirigentes.map(d => d.nome),
    ...e.dirigentes.map(d => d.cargo),
  ];
  let pts = 0;
  for (const c of campos) {
    const n = normalizar(c);
    if (n === termo) pts += 100;
    else if (n.startsWith(termo)) pts += 50;
    else if (n.includes(termo)) pts += 10;
  }
  return pts;
}

function pesquisar(dados: SioeDados, termo: string): Entidade[] {
  const t = normalizar(termo);
  if (!t) return [];
  const palavras = t.split(/\s+/).filter(p => p.length > 2);
  return dados.entidades
    .map(e => ({ e, pts: score(e, t) + palavras.reduce((a, p) => a + score(e, p) * 0.3, 0) }))
    .filter(r => r.pts > 0)
    .sort((a, b) => b.pts - a.pts)
    .slice(0, 10)
    .map(r => r.e);
}

// ── Handler ────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const { termo } = await request.json();
    if (!termo?.trim()) {
      return NextResponse.json({ error: 'Termo em falta.' }, { status: 400 });
    }

    const dados = carregarDados();
    if (!dados) {
      return NextResponse.json({
        error: 'Base de dados SIOE não encontrada. O workflow ainda não correu.',
        semDados: true,
      }, { status: 503 });
    }

    const resultados = pesquisar(dados, termo).map(e => ({
      nome: e.designacao,
      sigla: e.sigla || '',
      ministerio: e.ministerio || '',
      missao: e.missao || '',
      dirigentes: e.dirigentes.map(d => ({
        cargo: [d.orgao, d.cargo].filter(Boolean).join(' › '),
        nome: d.nome,
        desde: d.desde || '',
      })),
      contactos: [
        ...e.contactos,
        ...(e.website ? [{ tipo: 'Website', valor: e.website }] : []),
        ...(e.morada ? [{ tipo: 'Morada', valor: e.morada }] : []),
      ],
      fonte: 'https://www.sioe.dgaep.gov.pt/public/search',
      codigoSIOE: e.codigoSIOE,
    }));

    return NextResponse.json({
      entidades: resultados,
      aviso: `Dados de ${new Date(dados.meta.geradoEm).toLocaleDateString('pt-PT')} · ${dados.meta.totalEntidades} entidades`,
    });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
