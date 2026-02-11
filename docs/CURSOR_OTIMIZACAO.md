# Cursor — Guia de Otimização e Economia

Este documento complementa o plano de desempenho e economia do Cursor com as ações manuais que você precisa executar após a configuração automática.

## Status da Implementação

- [x] `.cursorignore` configurado na raiz do projeto

## Próximos Passos (ações manuais)

### 1. Reindexar o projeto

Após criar ou alterar o `.cursorignore`, é necessário reindexar o codebase:

1. Abra o **Command Palette**: `Ctrl+Shift+P` (Windows/Linux) ou `Cmd+Shift+P` (Mac)
2. Digite: **"Reindex"** ou **"Cursor: Reindex Codebase"**
3. Execute o comando e aguarde a conclusão

### 2. Extensões

- Revise as extensões instaladas
- Desative as que não usa semanalmente
- Dê prioridade a desativar language servers (Python, Java, C++) se não estiver usando essas linguagens

### 3. Configurações do Cursor

| Configuração | Ação recomendada |
|--------------|------------------|
| **Thinking mode** | Deixar desativado por padrão; ativar só quando necessário via `Ctrl+Shift+P` |
| **Modelo** | Usar Gemini Flash ou Claude Haiku para tarefas diárias; Sonnet apenas para tarefas críticas |
| **Contexto** | Usar `@` para referenciar arquivos específicos em vez de escanear o projeto inteiro |

### 4. Monitoramento

- Configure alertas de uso em ~2% do orçamento mensal (se disponível no plano)
- Mantenha o Cursor atualizado (1.4.5+ para melhorias de CPU)

## Referência rápida

- **Tarefas simples** → Gemini Flash
- **Tarefas complexas** → Claude Haiku
- **Revisões críticas** → Claude Sonnet
