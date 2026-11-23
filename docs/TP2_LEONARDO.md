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

## Preparação do computador (antes da aula)

Use a versão integrada do repositório. Instale Node compatível com
`frontend/package.json` (>=22.12.0), pnpm 11.25.0 e Python 3 com acesso pelo PATH.
Verifique `node --version`, `pnpm --version` e `python --version`.
Se algum comando não for reconhecido, confira a instalação e reabra o terminal;
não copie caminhos de executáveis específicos de outro computador.

PowerShell, a partir da raiz do projeto:

```powershell
python -m venv backend/.venv
& ./backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
Set-Location frontend
pnpm install --no-frozen-lockfile
pnpm exec playwright install chromium
Set-Location ..
```

No Prompt de Comando (CMD), a partir da raiz:

```bat
python -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
cd frontend
pnpm install --no-frozen-lockfile
pnpm exec playwright install chromium
cd ..
```

Faça os downloads e um ensaio antes da aula. A porta 5173 precisa estar livre;
não inicie o servidor de desenvolvimento manualmente para executar os E2E.

## Apresentação: executar todos os testes

Escolha apenas o bloco correspondente ao seu terminal. Comece na raiz do projeto.
O comando de cobertura do frontend já executa sua suíte de unidade/integração;
não é necessário repetir `pnpm test` durante a apresentação.

### PowerShell

```powershell
$env:PYTHON = (Resolve-Path ./backend/.venv/Scripts/python.exe).Path
$env:COVERAGE_FILE = Join-Path $env:TEMP 'nexocrm-tp2-coverage'
Set-Location backend
& $env:PYTHON -m pytest --cov=app --cov-report=term-missing -q
Set-Location ../frontend
pnpm run test:coverage
pnpm run test:e2e
```

### Prompt de Comando (CMD)

```bat
set "PYTHON=%CD%\backend\.venv\Scripts\python.exe"
set "COVERAGE_FILE=%TEMP%\nexocrm-tp2-coverage"
cd backend
"%PYTHON%" -m pytest --cov=app --cov-report=term-missing -q
cd ..\frontend
pnpm run test:coverage
pnpm run test:e2e
```

A variável `PYTHON` deve ser configurada novamente ao abrir outro terminal.
`COVERAGE_FILE` mantém o arquivo de medição Python fora do repositório.
Se algum comando falhar, examine a mensagem antes de seguir para o próximo.
Como verificação adicional, execute `pnpm build` na pasta `frontend`.

No Linux/macOS, crie a venv com `python3`, use seu executável
`backend/.venv/bin/python` e exporte seu caminho absoluto em `PYTHON`.
O Chromium pode requerer `pnpm exec playwright install-deps chromium` no Linux.

## Executar somente os testes de Leonardo

Na pasta `frontend`, após configurar `PYTHON` conforme acima:

```text
node --test src/components/OpportunityForm.test.js src/components/OpportunityCard.test.js
node --test e2e/opportunities-isolation.test.js
```

O primeiro comando deve apresentar `tests 2`, `pass 2` e `fail 0`.
O segundo deve apresentar `tests 1`, `pass 1` e `fail 0`.
Os tempos variam conforme o computador.

Os componentes rodam em um DOM simulado. Os E2E usam Chromium sem janela
visível; o resultado é mostrado no terminal. Os testes iniciam seus próprios
servidores, usam bancos temporários e encerram os recursos ao terminar.
O novo cenário de Leonardo não usa o banco normal `backend/nexocrm.db`.
Não são necessárias credenciais nem configuração manual de `.env` para esse cenário.

## Resultado integrado verificado em 23/11/2026

Versão de código testada: `4c50825` da main, incluindo os PRs de Felipe,
Alexandre, Ana Júlia e Leonardo. A verificação usou Node 24.22.3 e Python 3.12.14.

| Execução | Resultado |
| --- | --- |
| Unidade/integração pelo comando do frontend | 28 passaram, 0 falhas |
| Testes Python do backend | 5 passaram |
| E2E do grupo | 4 passaram, 0 falhas |
| Build do frontend | Passou |

Os quatro casos E2E verificam:

1. Cadastro, pesquisa, edição de cliente e registro de interação (Felipe).
2. Rejeição de e-mail já cadastrado pela API (Ana Júlia).
3. Criação de oportunidade, mudança para Ganho e persistência na visão do cliente (Alexandre).
4. Mudança para Perdido, filtros, totais e isolamento entre dois clientes (Leonardo).

No relatório Node, `tests` indica a quantidade de casos, `pass` os aprovados,
`fail` as falhas e `duration_ms` o tempo total em milissegundos.
No pytest, a confirmação é `5 passed`; o relatório de cobertura aparece acima.
Na máquina de verificação, os quatro E2E levaram aproximadamente 11 segundos.

## Cobertura: escopo dos relatórios

- Backend (`pytest --cov=app`): 202 de 251 instruções cobertas, aproximadamente
  80,48%. O terminal, com a precisão padrão, mostra 80%. Inclui os módulos de
  `app`, inclusive `main.py`, que apareceu com 0% nesta execução.
- Frontend (`pnpm run test:coverage`): 97,87% de linhas, 85,81% de ramificações
  e 95% de funções nos seis arquivos JS de domínio/serviços listados no relatório.
  Testes e auxiliares não entram na contagem. Os componentes JSX carregados pelo
  Vite não são contabilizados, embora sejam exercitados pelos testes.

São medições de escopos diferentes, não uma porcentagem única do sistema.
Não se deve apresentar o percentual do frontend como cobertura de todo o frontend.
Os E2E verificam o fluxo integrado, mas não entram nesses relatórios de cobertura.

## Explicação dos testes na apresentação

O teste US05 verifica o contrato de envio do formulário e a validação dos campos.
O teste US06 verifica o ID e a etapa solicitados, além do bloqueio durante o salvamento.
As funções externas são simuladas nesses dois casos. O E2E complementa essas
verificações usando API e banco reais, consultando o estado persistido e verificando
os dados pela interface após recarregar. Recarregar a página não equivale a reiniciar
os servidores. O cenário verifica comportamentos definidos, não ausência de todos os bugs.
