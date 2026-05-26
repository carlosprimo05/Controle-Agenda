# Controle Agenda

Aplicação React + Vite integrada ao Supabase para gerenciamento de serviços, histórico, chat e administração local.

## Status atual

- O código está no GitHub em `main`
- O repositório foi enviado com sucesso
- O site ainda não está publicado
- URL de deploy pretendida: `https://carlosprimo05.github.io/Controle-Agenda`
- Atualmente, essa URL retorna `404` porque ainda não foi feito o deploy para GitHub Pages

## Como executar localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/carlosprimo05/Controle-Agenda.git
   ```
2. Entre na pasta do projeto:
   ```bash
   cd Controle-Agenda
   ```
3. Instale dependências:
   ```bash
   npm install
   ```
4. Crie um arquivo `.env` baseado em `.env.example`:
   ```bash
   cp .env.example .env
   ```
5. Abra `.env` e atualize a chave:
   ```env
   VITE_SUPABASE_URL=https://vuzrhhzssetakpzwctmg.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```
6. Rode em modo de desenvolvimento:
   ```bash
   npm run dev
   ```

## Publicação do site

Este projeto já tem suporte a GitHub Pages via `gh-pages`.

Para publicar, execute:

```bash
npm run deploy
```

Após o deploy, o site deve ficar disponível em:

`https://carlosprimo05.github.io/Controle-Agenda`

> Observação: se preferir, também é possível publicar usando Vercel, Netlify ou outro serviço de hospedagem estática.

## Variáveis de ambiente

Use `.env.example` como modelo.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
