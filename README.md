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

## Como funciona

Um `PingService` roda em `onModuleInit` — parseia `TARGET_URLS` (separada por vírgula),
agenda um cron via `node-cron` (`*/N * * * * *`, N = `PING_INTERVAL_SECONDS`, default 60) e
dispara **uma execução imediata** pra você não esperar o primeiro tick.

Cada tick faz `GET` em paralelo (`Promise.all`) em cada URL com `axios`:

```
┌──────────────────────────────────────────────────────────────────┐
│  cron tick (a cada N segundos)                                   │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐         │
│  │  GET url[0]   │  │  GET url[1]   │  │  GET url[2]   │  …     │
│  │  timeout 10s  │  │  timeout 10s  │  │  timeout 10s  │         │
│  └──────┬────────┘  └──────┬────────┘  └──────┬────────┘         │
│         ▼                  ▼                  ▼                  │
│    grava Reading      grava Reading      grava Reading           │
│    { url, statusCode, latencyMs, timestamp } → SQLite            │
└──────────────────────────────────────────────────────────────────┘
```

- Qualquer resposta HTTP conta (`validateStatus: () => true`) — 4xx e 5xx viram Readings
  válidos com o `statusCode` real.
- Erro de rede / DNS / timeout (10s) → `statusCode = 0` + `latencyMs ≈ 10000`. Assim o
  gráfico de uptime da fase 5 distingue "site respondeu com erro" de "site sumiu".
- Pings em paralelo — uma URL lenta não atrasa as outras.

Entity em [apps/api/src/ping/reading.entity.ts](apps/api/src/ping/reading.entity.ts),
serviço em [apps/api/src/ping/ping.service.ts](apps/api/src/ping/ping.service.ts).
