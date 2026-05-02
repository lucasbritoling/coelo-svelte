# Justfile

# Define o shell (opcional, mas recomendado no Linux/macOS)
set shell := ["bash", "-c"]

# O comando que você criou
preview:
    bun clean
    bun run build
    npx wrangler pages dev .svelte-kit/cloudflare --compatibility-flag=nodejs_compat

# Dica: adicione um comando padrão
default:
    @just --list
