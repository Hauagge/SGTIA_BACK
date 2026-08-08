# Backend

API e regras de negócio do SGTIA. Monólito modular.

## Stack
- Next.js (API routes) / Node + TypeScript
- PostgreSQL + ORM (migrations versionadas)
- Auth por sessão ou JWT
- Storage compatível com S3 (áudios e anexos)
- OpenAI API (transcrição + interpretação)

## Módulos (roadmap, seção 3)
- **Auth** — login, logout, sessão, proteção de rotas, usuário ativo/inativo
- **Projects** — projetos e `ProjectMember`
- **Tasks** — entidade `Task`, status, prioridade, histórico, acceptance criteria
- **Comments** — comentários por tarefa
- **Attachments** — upload para storage externo (imagens, vídeos, PDFs, áudio)
- **AI Processing** — pipeline de interpretação e transcrição

## Entidades
`Workspace · User · Project · ProjectMember · Task · AcceptanceCriterion · Comment · Attachment · TaskHistory`

Toda entidade relevante carrega `workspaceId` (preparação para multiempresa).

## Pipeline de IA (Fases 3–5)
```
Texto/Áudio → (transcrição) → Classificação → Parser específico → Validação de schema → TaskDraft
```
- Texto digitado e transcrito usam o **mesmo pipeline**
- IA nunca cria tarefa automaticamente — sempre gera rascunho para revisão
- Controle de alucinação: dados desconhecidos vão para `missingInformation`
- Persistir entrada original, resultado da IA, modelo e horário (auditoria)

## Produção (Fase 6)
Tratamento de erros, retry controlado, logs estruturados, rate limiting,
autorização por workspace/projeto, URLs temporárias, backup do PostgreSQL.

Schemas compartilhados em [`../shared`](../shared).
