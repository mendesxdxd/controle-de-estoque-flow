---
description: Commit e push para GitHub (deploy automático via Vercel)
---

# Push para GitHub (deploy automático na Vercel)

Quando o usuário disser "push", execute os seguintes passos:

1. Rodar verificação de tipos TypeScript:
// turbo
```
npx tsc --noEmit
```

2. Adicionar todas as alterações ao git:
// turbo
```
git add -A
```

3. Perguntar ao usuário a mensagem do commit (ou sugerir uma baseada nas alterações feitas).

4. Fazer o commit:
```
git commit -m "<mensagem>"
```

5. Fazer push para o GitHub:
```
git push origin main
```

6. Informar ao usuário que o push foi feito e que a Vercel vai buildar automaticamente.

## Notas
- Se o TypeScript falhar, pare e informe o erro.
- O deploy é automático via integração GitHub + Vercel (projeto: flowestoque).
- URL de produção: https://flowestoque.vercel.app
- Repositório: https://github.com/mendesxdxd/controle-do-chip
