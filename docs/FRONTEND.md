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
| US01 | Cadastrar cliente ou lead com nome, tipo, e-mail único, telefone e empresa opcionais; validação e feedback. |
| US02 | Visualizar e pesquisar clientes/leads em `#/clientes`; busca textual e filtros de tipo; métricas resumidas. |
| US03 | Atualizar dados cadastrais via modal na listagem ou na visão consolidada; validação e preservação de dados. |
| US04 | Registrar contato (ligação, reunião, e-mail ou outro) com data/hora e anotações; atualização do histórico. |
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

## Integrar com o backend

Copie `frontend/.env.example` para `frontend/.env`, configure e reinicie o Vite:

```ini
VITE_DATA_SOURCE=api
VITE_API_URL=http://127.0.0.1:8000
```

O modo API nunca retorna dados fictícios quando o servidor falha. Os endpoints
abaixo são uma **proposta do frontend**, não endpoints já confirmados no backend:

| Método e caminho | Resposta esperada |
| --- | --- |
| GET /clients | Lista JSON de clientes |
| POST /clients | Objeto completo do cliente cadastrado, incluindo id |
| PUT /clients/{id} | Objeto completo do cliente atualizado |
| GET /opportunities | Lista JSON de oportunidades |
| POST /opportunities | Objeto completo da oportunidade criada, incluindo id |
| PATCH /opportunities/{id} | Objeto completo atualizado; corpo enviado: `{"stage":"won"}` |
| GET /interactions | Lista JSON de interações |
| POST /interactions | Objeto completo da interação registrada, incluindo id |

Formato dos registros (listas sem envelope/paginação nesta proposta):

```json
{
  "client": { "id": 1, "name": "Marina Costa", "company": "Aurora Studio", "type": "client", "email": "marina@example.com", "phone": "(31) 99999-0101" },
  "opportunity": { "id": "abc", "client_id": 1, "title": "Consultoria", "value": 1250.5, "stage": "new", "expected_close_date": null, "notes": "", "created_at": "2026-09-26T12:00:00Z" },
  "interaction": { "id": 1, "client_id": 1, "type": "call", "description": "Primeiro contato.", "occurred_at": "2026-09-25T12:00:00Z" }
}
```

POST envia os campos da oportunidade exceto `id` e `created_at`, gerados pelo
servidor. `value` deve ser um número JSON. Datas de fechamento usam `YYYY-MM-DD`
ou `null`. Data/hora das interações usa ISO 8601 com fuso. Tipos de interação:
`call`, `meeting`, `email` ou `other`; clientes: `client` ou `lead`.

O backend deve validar os dados novamente, conferir a existência do cliente e
persistir as mudanças. Habilitar CORS para a origem local efetiva do frontend.
Se o backend usar nomes em português, valores decimais como string, paginação,
ou consultas por cliente, adaptar `services/api.js` para fornecer o formato
interno acima. Não espalhar diferenças do contrato pelas telas.

Para integrar o frontend do Felipe, manter uma única aplicação React e incorporar
as rotas/componentes das US01–US04. O acesso à US08 é `#/clientes/{id}`. O funil
é `#/funil`. Esse roteamento simples pode ser adaptado à base comum da equipe.

## Roteiro de revisão humana

1. Criar oportunidade para Marina com valor 1.250,50; conferir cartão e total.
2. Mover para Ganho; conferir mudança de coluna e valor conquistado.
3. Recarregar; confirmar persistência no modo demonstração.
4. Abrir Marina pelo seletor; conferir vínculo e histórico de interações.
5. Tentar enviar formulário vazio e com valor negativo; conferir bloqueio.
6. Cancelar ou pressionar Escape; confirmar que não cria oportunidade.
7. Buscar texto inexistente; verificar mensagem e limpar a busca.
8. Revisar a interface no celular e navegar no formulário pelo teclado.
9. Repetir criação, mudança de etapa e recarga com o backend real antes da entrega.

## Recuperação dos dados de demonstração

Os clientes/interações são fixos e fictícios. Oportunidades ficam no
`localStorage`, chave `nexocrm.demo.opportunities.v1`, por origem/navegador.
Não são compartilhadas com o grupo nem armazenadas em SQLite. Não inserir
dados reais nessa demonstração. Ao detectar dados corrompidos, a tela mostra
erro e preserva o conteúdo salvo.

Para recomeçar a demonstração, após guardar qualquer informação que queira
manter, remova **somente essa chave** no painel de armazenamento das ferramentas
do navegador e recarregue. Isso descarta as oportunidades de demonstração
criadas nesse navegador e recupera os exemplos iniciais.

## Commits e revisão

Não fazer um único commit com toda esta versão. Revisar o código com Leonardo e
separar mudanças funcionais de até 100 linhas com Conventional Commits, usando
seleção de trechos quando necessário. O pnpm-lock.yaml local não deve ser
incluído nos commits. Não comprimir o código para contornar o limite.
Só atribuir autoria/revisão que realmente ocorreu.
Os commits da equipe devem respeitar a participação mínima de 15% por membro.
