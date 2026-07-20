# API Monitor Dashboard

Monitora latência e status code de qualquer URL e exibe métricas em tempo real.

## Como usar

1. `cp .env.example .env`
2. Defina `TARGET_URLS=https://minha-api.com,https://outra.com`
3. `pnpm install && pnpm dev`

Web em [http://localhost:5173](http://localhost:5173), API em
[http://localhost:3000](http://localhost:3000).

## Stack

- **API**: NestJS · TypeORM · SQLite (via [sql.js](https://sql.js.org/)) · node-cron
- **Web**: React · Vite · TanStack Query · Recharts

SQLite roda sem docker e sem native build — usamos `sql.js` (SQLite compilado pra WASM),
que roda em qualquer Node sem `node-gyp`. Na primeira execução o arquivo
`data/api-monitor.sqlite` é criado dentro de `apps/api/`. Basta configurar `TARGET_URLS`
e rodar.
