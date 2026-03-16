#!/usr/bin/env node
/**
 * download-sioe.mjs
 * Descarrega todas as entidades públicas do SIOE via WebService SOAP oficial.
 * Sem autenticação, sem API key — é um serviço público da DGAEP.
 *
 * Documentação: https://www.sioe.dgaep.gov.pt/SIOE%20Faced%20WebServices%20v1_7.pdf
 * Endpoint: https://pr-wfssioe.dgaep.gov.pt/SIOEPublicService.svc
 *
 * Uso:
 *   node scripts/download-sioe.mjs
 *   node scripts/download-sioe.mjs --paginas 5   (testar com menos páginas)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'sioe.json');
const BASE_URL = 'https://pr-wfssioe.dgaep.gov.pt/SIOEPublicService.svc';
const NS = 'https://sioe.dgaep.gov.pt';

// Controlo de ritmo — não spammar o servidor
const DELAY_MS = 300;
const RESULTS_PER_PAGE = 100;

const args = process.argv.slice(2);
const maxPaginas = args.includes('--paginas')
  ? parseInt(args[args.indexOf('--paginas') + 1])
  : Infinity;

// ── SOAP helpers ────────────────────────────────────────────────────────────

function soapEnvelope(body) {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope
  xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:ns="${NS}">
  <soap:Header/>
  <soap:Body>
    ${body}
  </soap:Body>
</soap:Envelope>`;
}

async function soapCall(action, bodyXml) {
  const envelope = soapEnvelope(bodyXml);
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': `"${NS}/${action}"`,
      'User-Agent': 'SIOE-Downloader/1.0',
    },
    body: envelope,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} para ação ${action}`);
  }
  return await res.text();
}

// ── Parsing de XML simples ───────────────────────────────────────────────────

function getTag(xml, tag) {
  const re = new RegExp(`<(?:[^:>]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:[^:>]+:)?${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1].trim() : '';
}

function getAllTags(xml, tag) {
  const re = new RegExp(`<(?:[^:>]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:[^:>]+:)?${tag}>`, 'gi');
  const results = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    results.push(m[1].trim());
  }
  return results;
}

function decodeXml(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

// ── Search ───────────────────────────────────────────────────────────────────

async function search(pagina) {
  const xml = await soapCall('Search', `
    <ns:Search>
      <ns:request>
        <ns:NrResultados>${RESULTS_PER_PAGE}</ns:NrResultados>
        <ns:PaginaResultados>${pagina}</ns:PaginaResultados>
        <ns:Classe>Entidade</ns:Classe>
      </ns:request>
    </ns:Search>
  `);

  const resultados = getAllTags(xml, 'Resultado');
  return resultados.map(r => ({
    codigoSIOE: decodeXml(getTag(r, 'CodigoSIOE')),
    designacao: decodeXml(getTag(r, 'Designacao')),
    sigla: decodeXml(getTag(r, 'Sigla')),
    classe: decodeXml(getTag(r, 'Classe')),
  })).filter(r => r.codigoSIOE);
}

// ── Get (detalhe) ─────────────────────────────────────────────────────────────

async function getDetalhe(codigoSIOE) {
  const xml = await soapCall('Get', `
    <ns:Get>
      <ns:request>
        <ns:CodigoSIOE>${codigoSIOE}</ns:CodigoSIOE>
        <ns:IncluirHistorico>false</ns:IncluirHistorico>
      </ns:request>
    </ns:Get>
  `);

  // Entidade
  const entidadeXml = getTag(xml, 'Entidade');
  const entidade = {
    codigoSIOE,
    designacao: decodeXml(getTag(entidadeXml, 'Designacao')),
    sigla: decodeXml(getTag(entidadeXml, 'Sigla')),
    missao: decodeXml(getTag(entidadeXml, 'Missao')),
    ministerio: decodeXml(getTag(entidadeXml, 'MinisterioSecretariaRegional')),
    nipc: decodeXml(getTag(entidadeXml, 'NIPC')),
    website: decodeXml(getTag(entidadeXml, 'Website')),
  };

  // Contactos
  const contactosXml = getAllTags(xml, 'Contacto');
  entidade.contactos = contactosXml.map(c => ({
    tipo: decodeXml(getTag(c, 'Tipo')),
    valor: decodeXml(getTag(c, 'Valor')),
  })).filter(c => c.valor);

  // Órgãos de direção + membros
  const orgaosXml = getAllTags(xml, 'OrgaoDirecao');
  entidade.dirigentes = [];
  for (const orgao of orgaosXml) {
    const nomeOrgao = decodeXml(getTag(orgao, 'Designacao'));
    const membros = getAllTags(orgao, 'MembroOrgao');
    for (const m of membros) {
      entidade.dirigentes.push({
        orgao: nomeOrgao,
        cargo: decodeXml(getTag(m, 'Cargo')),
        nome: decodeXml(getTag(m, 'Nome')),
        desde: decodeXml(getTag(m, 'DataInicio')),
      });
    }
  }

  // Morada (da primeira unidade local)
  const ulXml = getTag(xml, 'UnidadeLocal');
  const moradaXml = getTag(ulXml, 'Morada');
  if (moradaXml) {
    entidade.morada = [
      decodeXml(getTag(moradaXml, 'Rua')),
      decodeXml(getTag(moradaXml, 'CodigoPostal')),
      decodeXml(getTag(moradaXml, 'Localidade')),
    ].filter(Boolean).join(', ');
  }

  return entidade;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('🔍 SIOE Downloader — a iniciar...');
  console.log(`   Endpoint: ${BASE_URL}`);
  console.log(`   Output:   ${OUTPUT_FILE}`);
  console.log('');

  // Criar pasta data/ se não existir
  const dataDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  // 1. Obter lista de todas as entidades (paginado)
  const todasEntidades = [];
  let pagina = 1;
  let continuar = true;

  console.log('📋 Fase 1: a obter lista de entidades...');
  while (continuar && pagina <= maxPaginas) {
    try {
      const resultados = await search(pagina);
      if (resultados.length === 0) {
        continuar = false;
      } else {
        todasEntidades.push(...resultados);
        process.stdout.write(`\r   ${todasEntidades.length} entidades encontradas (pág. ${pagina})...`);
        pagina++;
        await sleep(DELAY_MS);
      }
    } catch (e) {
      console.error(`\n   ⚠ Erro na pág. ${pagina}: ${e.message} — a tentar continuar...`);
      await sleep(2000);
      pagina++; // saltar página com erro
    }
  }

  console.log(`\n   ✅ ${todasEntidades.length} entidades na lista.\n`);

  // 2. Para cada entidade, obter detalhes
  console.log('📥 Fase 2: a obter detalhes de cada entidade...');
  const entidadesCompletas = [];
  let erros = 0;

  for (let i = 0; i < todasEntidades.length; i++) {
    const { codigoSIOE, designacao } = todasEntidades[i];
    try {
      const detalhe = await getDetalhe(codigoSIOE);
      entidadesCompletas.push(detalhe);
      process.stdout.write(`\r   ${i + 1}/${todasEntidades.length} — ${designacao.slice(0, 50)}`);
      await sleep(DELAY_MS);
    } catch (e) {
      erros++;
      // Guardar entrada mínima mesmo sem detalhe
      entidadesCompletas.push({
        ...todasEntidades[i],
        contactos: [],
        dirigentes: [],
        erro: e.message,
      });
      await sleep(1000);
    }
  }

  console.log(`\n   ✅ Detalhes obtidos. Erros: ${erros}\n`);

  // 3. Guardar resultado
  const output = {
    meta: {
      geradoEm: new Date().toISOString(),
      totalEntidades: entidadesCompletas.length,
      erros,
    },
    entidades: entidadesCompletas,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`💾 Ficheiro guardado: ${OUTPUT_FILE}`);
  console.log(`   ${entidadesCompletas.length} entidades | ${erros} erros`);
  console.log('');
  console.log('✅ Concluído!');
}

main().catch(e => {
  console.error('❌ Erro fatal:', e);
  process.exit(1);
});
