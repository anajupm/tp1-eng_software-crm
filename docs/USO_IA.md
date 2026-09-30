# Registro inicial de uso de IA

## Sessão de 26/09/2026 — frontend das US05–US08

- Ferramenta: OpenAI Codex.
- Contexto fornecido: enunciado do TP1, README aprovado e divisão de histórias
  discutida pela equipe. Leonardo autorizou começar o desenvolvimento local.
- Objetivo: desenvolver o frontend de oportunidades e visão do cliente sem
  aguardar a implementação do frontend das US01–US04.
- Produção da IA: base React/Vite, componentes, CSS, dados fictícios, adaptadores
  de dados, validações, documentação e verificações automatizadas.
- Decisões provisórias: cinco etapas comerciais, campos da oportunidade e
  contrato HTTP. Ainda precisam de alinhamento com o backend do grupo.
- Verificações técnicas: build de produção; 11 testes de validação, persistência
  e contrato do adaptador; navegação no navegador local.
- Limitações: backend real indisponível nesta versão; ainda não houve validação
  da integração, revisão humana completa ou confirmação de domínio do código.
- Dificuldades observadas: permissões do ambiente na instalação/compilação;
  necessidade de separar dados simulados do contrato real; aba de verificação
  separada para evitar interferir com a navegação do usuário.

## Preencher após revisão humana

- Revisor e data:
- O que Leonardo entendeu e conseguiu explicar:
- Erros encontrados, sugestões recusadas e ajustes feitos pela equipe:
- Benefícios e limitações percebidos:
- Evidências da integração real:
- Estimativa final de código gerado por IA e método de estimativa:

O código novo desta sessão foi produzido pela IA. Não confundir execução de
testes com revisão/aprovação humana, nem usar esta sessão para estimar a
porcentagem de todo o sistema antes das contribuições dos demais integrantes.

## Sessão de 29/09/2026 — frontend das US01–US04

- Integrante responsável: Felipe Pires de Oliveira.
- Ferramenta: Antigravity.
- Contexto fornecido: repositório do projeto, frontend de US05–US08 desenvolvido por Leonardo, branches de backend e requisitos das histórias US01 a US04.
- Objetivo: implementar o frontend completo das histórias de usuário 1 a 4 (cadastro, listagem, pesquisa, edição de clientes e registro de interações), respeitando Conventional Commits e commits atômicos de no máximo 100 LOC.
- Produção da IA: regras de domínio de clientes e interações, componentes de listagem/pesquisa (`ClientList`), formulário de cliente (`ClientForm`), formulário de interação (`InteractionForm`), extensão do adaptador HTTP e do armazenamento de demonstração, novos testes automatizados e documentação.
- Verificações técnicas: 20 testes unitários automatizados cobrindo domínio, persistência e contratos de API (100% de sucesso); build de produção do Vite bem-sucedido.

