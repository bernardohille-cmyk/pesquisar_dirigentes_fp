# 🔎 Diretório de Dirigentes Públicos PT

Consulta inteligente de cargos e contactos da Administração Pública.

## ⚠️ Sobre o Limite de Pesquisa (Quota Exceeded)
Este projeto utiliza a **Google Search Tool** via Gemini API. A Google impõe um limite de **20 requisições por minuto** na camada gratuita.

### Como funciona a proteção:
1. O sistema detecta o erro `429 (Too Many Requests)`.
2. O botão de pesquisa é **bloqueado automaticamente por 30 segundos**.
3. Um contador regressivo indica quando podes realizar a próxima consulta.



## 🛠️ Configuração
1. Instala o Node.js.
2. Define `GEMINI_API_KEY` no teu `.env.local`.
3. Executa `npm run dev`.