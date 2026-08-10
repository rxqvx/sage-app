# Imagem de producao. Em desenvolvimento este projeto NAO usa Docker -- roda
# direto com `pnpm dev`.
#
# Nao ha build arg de URL aqui. Desde que o navegador passou a falar so com a
# propria origem (`/api/erp` e `/api/employee`), os enderecos do BFF e da API
# viraram variaveis de RUNTIME, lidas apenas no servidor. Trocar de ambiente
# deixou de exigir rebuild.

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app


# --- dependencias ---------------------------------------------------------
FROM base AS dependencias
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile


# --- build ----------------------------------------------------------------
FROM base AS construcao

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=dependencias /app/node_modules ./node_modules
COPY . .
RUN pnpm build


# --- execucao -------------------------------------------------------------
# Parte de `node:22-alpine` direto, e nao de `base`: o estagio de execucao nao
# precisa de corepack nem de gerenciador de pacote nenhum.
FROM node:22-alpine AS producao

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# O npm que vem na imagem carrega dependencias proprias com CVEs conhecidas
# (tar, brace-expansion, sigstore, picomatch, ip-address) -- eram TODAS as
# vulnerabilidades CRITICAL/HIGH desta imagem. Aqui o build e feito com pnpm e o
# runtime e so `node server.js`: o npm nunca executa, entao remove-lo elimina as
# CVEs sem tirar nada que a aplicacao use.
RUN rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/bin/npm \
           /usr/local/bin/npx \
           /opt/yarn-*

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# `output: "standalone"` no next.config.ts empacota so o necessario para
# servir, com as dependencias que o servidor realmente usa -- a imagem final
# nao carrega o node_modules de desenvolvimento.
COPY --from=construcao --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=construcao --chown=nextjs:nodejs /app/.next/static ./.next/static
# Nao ha `public/` neste projeto -- os poucos assets sao SVG inline. Se um dia
# passar a existir, acrescente aqui: COPY .../public ./public

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
