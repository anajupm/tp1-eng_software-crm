# Frontend de Leonardo — US05 a US08

## Estado da entrega

Versão inicial local, gerada com auxílio de IA em 26/09/2026 e pendente de
revisão humana. A integração com o backend do grupo ainda não foi verificada.
Nenhum cadastro/edição de clientes ou registro de interações foi implementado
aqui: essas operações pertencem às US01–US04. O seletor de clientes permite
acessar a US08 enquanto o restante do frontend não está disponível.

## Executar

Com Node.js 22.12+ e pnpm 11, a partir da raiz do repositório:

```sh
cd frontend
pnpm install --no-frozen-lockfile
pnpm dev
```

Abra o endereço informado no terminal (normalmente http://127.0.0.1:5173).
`pnpm build` gera `frontend/dist`; `pnpm preview` serve essa compilação.
`pnpm test` executa as verificações pequenas de validação, armazenamento e
adaptador. Elas auxiliam a implementação, mas não contam na avaliação do TP1.
O lockfile não é versionado. A instalação gera um pnpm-lock.yaml local,
ignorado pelo Git; instalações novas podem resolver versões diferentes dentro
das faixas do package.json. O pnpm autoriza somente o build do esbuild.

## O que revisar em cada história

| História | Critérios implementados |
| --- | --- |
| US05 | Selecionar cliente existente; informar título e valor; criar oportunidade; visualizar cartão e confirmação; indicar erros sem perder o formulário. |
| US06 | Alterar etapa no cartão; atualizar coluna e totais após sucesso; manter a etapa anterior se a gravação falhar; impedir mudanças simultâneas no mesmo cartão. |
| US07 | Exibir colunas, quantidades e valores por etapa; filtrar abertas/encerradas e buscar por título, cliente ou empresa; indicar resultado vazio. |
| US08 | Acessar um cliente; exibir contatos, oportunidades e histórico em ordem decrescente; criar oportunidade com cliente preenchido; indicar cliente inexistente e histórico vazio. |

Os indicadores superiores representam **todas** as oportunidades, independentemente
da busca. Os totais de cada coluna representam apenas os cartões visíveis.
No celular, o funil tem rolagem horizontal para preservar a leitura dos cartões.

## Decisões provisórias de negócio

- Etapas: `new` (Novo), `contact` (Em contato), `proposal` (Proposta), `won`
  (Ganho), `lost` (Perdido). Centralizadas em `src/domain/opportunities.js`.
- Qualquer etapa pode mudar para qualquer outra, incluindo reabertura.
- Título obrigatório, até 120 caracteres; cliente obrigatório.
- Valor obrigatório em reais, de zero a 999.999.999,99, até duas casas decimais.
- Previsão de fechamento opcional; datas passadas são aceitas.
- Observações opcionais, até 2.000 caracteres.
- Não há login, responsáveis por oportunidade, exclusão, edição geral da
  oportunidade ou arrastar cartões, pois não foram definidos nas US05–US08.

## Organização para entender o código

1. `src/App.jsx`: navegação, carregamento, mensagens e coordenação das alterações.
2. `components/Pipeline.jsx`: filtros, indicadores e colunas do funil.
3. `components/OpportunityCard.jsx`: cartão compartilhado e seletor de etapa.
4. `components/OpportunityForm.jsx`: formulário modal, validação e envio.
5. `components/ClientDetail.jsx`: dados, oportunidades e histórico do cliente.
6. `domain/opportunities.js`: etapas, formatação e validação de negócio.
7. `services/index.js`: seleciona explicitamente demonstração ou API.
8. `services/demo.js` e `fixtures.js`: simulação com contatos fictícios.
9. `services/api.js`: único adaptador HTTP, para ajustar com Alexandre e Ana.
10. `styles.css` e `components.css`: estilos e adaptação a telas menores.
