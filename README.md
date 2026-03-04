# 🔎 Diretório de Dirigentes Públicos PT

Ferramenta de consulta inteligente que cruza dados do SIOE, DRE e portais governamentais em tempo real.

## 🛠️ Stack Tecnológica
- **Framework:** Next.js 14 (App Router)
- **IA:** Google Gemini 2.0 Flash (com Google Search Tool)
- **Estilo:** CSS-in-JS (focado em performance e portabilidade)

## 🚦 Notas de Performance
Este projeto utiliza a **Search Tool** do Gemini. 
- **Limites:** A API gratuita tem uma quota de requisições por minuto.
- **Dica:** Se receberes o aviso de "Limite atingido", aguarda alguns segundos. A IA precisa de tempo para indexar as fontes oficiais.

## ⚙️ Instalação
1. `npm install`
2. Criar `.env.local` com `GEMINI_API_KEY=tuachave`
3. `npm run dev`