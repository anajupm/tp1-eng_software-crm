# TP2 — testes de Leonardo

## Escopo

Dois testes de unidade de componentes React, com callbacks simulados:

- `OpportunityForm.test.js` (US05): tentativa inválida não chama `onSave`,
  indica os campos inválidos e dá foco ao título. Após corrigir o formulário,
  envia uma única oportunidade com cliente, etapa, valor numérico e textos normalizados.
- `OpportunityCard.test.js` (US06): selecionar Perdido chama `onStageChange`
  com o ID correto; `busy=true` bloqueia o seletor e impede outra solicitação.
  Após o componente pai confirmar o estado, o seletor mostra Perdido e volta a ficar disponível.
  Este teste não simula nem comprova a persistência da API.

O teste `e2e/opportunities-isolation.test.js` verifica US05–US08 no Chromium,
com Vite, FastAPI e SQLite temporário reais. Clientes e interações são criados
pela API como preparação. As oportunidades são criadas pela interface.
Uma oportunidade passa para Perdido; a outra continua aberta. São conferidos
os totais, filtros, busca, persistência e isolamento das oportunidades e
interações na visão de cada cliente, antes e depois de recarregar.
O estado final também é consultado diretamente pela API.

## Instalação e execução (PowerShell, a partir da raiz)

Requer Node compatível com `frontend/package.json`, pnpm e Python 3.
Se Python não estiver no PATH, substitua `python` pelo caminho do executável.

```powershell
python -m venv backend/.venv
& ./backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
$env:PYTHON = (Resolve-Path ./backend/.venv/Scripts/python.exe).Path
Set-Location frontend
pnpm install --no-frozen-lockfile
pnpm exec playwright install chromium
pnpm test
pnpm run test:coverage
pnpm run test:e2e
pnpm build
```

Para executar somente a contribuição de Leonardo, a partir de `frontend`:

```powershell
node --test src/components/OpportunityForm.test.js src/components/OpportunityCard.test.js
node --test e2e/opportunities-isolation.test.js
```

No Linux/macOS, use o Python de `backend/.venv/bin/python` na variável `PYTHON`.
O Chromium pode requerer `pnpm exec playwright install-deps chromium` no Linux.

Não é necessário iniciar servidores manualmente. A porta 5173 deve estar livre;
os testes não encerram servidores de outras sessões. A API usa porta dinâmica.
O script E2E executa arquivos sequencialmente para evitar disputa pela porta 5173.
O banco do novo cenário fica em diretório temporário exclusivo, removido ao terminar,
e não usa `backend/nexocrm.db`. Não são necessárias credenciais nem arquivo `.env`.

## Cobertura e limites

O comando existente usa a cobertura nativa do Node. Os componentes JSX carregados
pelo Vite não aparecem nesse relatório, embora os testes os exercitem.
O helper de testes foi excluído explicitamente para não inflar a porcentagem.
O relatório também não mede o Python nem inclui todos os arquivos não carregados.
Portanto, seu percentual não comprova sozinho 80% de cobertura do sistema.
O E2E verifica cenários adicionais, mas não entra na medição desse comando.

Esses três casos complementam o trabalho do grupo, sem equivaler a quatro E2E.
A versão final integrada deve ser reexecutada após reunir as contribuições.

## Preparação para a apresentação

Antes da apresentação, Leonardo deve revisar e conseguir explicar a preparação
dos dados, as ações, as asserções e a limpeza de recursos de cada caso.
Pontos para discussão: uso de seletores acessíveis, isolamento de banco, callbacks
simulados nos testes de componentes e limites da medição de cobertura.

## Verificação local em 22/11/2026

- Suíte de unidade/integração do frontend: 26 casos passaram, incluindo os dois novos.
- E2E existente de clientes/interações: passou. Novo E2E US05–US08: passou
  após corrigir um seletor ambíguo no próprio teste.
- Build de produção: passou.
- Cobertura reportada dos cinco arquivos JS listados: 97,70% de linhas,
  85,19% de ramificações e 92% de funções, com as limitações descritas acima.
- Chromium instalado pelo Playwright; backend executado com o Python do ambiente
  virtual já disponível no computador e seus módulos FastAPI/SQLAlchemy/Uvicorn.
- Nenhuma alteração no código funcional da aplicação.
