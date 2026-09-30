# NexoCRM - CRM para Pequenas Equipes Comerciais

## Integrantes e papéis

- **Ana Julia Pinheiro Macedo** — Backend
- **Alexandre da Cunha Cenachi** — Fullstack
- **Felipe Pires de Oliveira** — Frontend
- **Leonardo Murilho de Aquino Pereira** — Frontend

## Objetivo

O NexoCRM é um sistema desenvolvido para apoiar pequenas equipes comerciais no gerenciamento de clientes, leads e oportunidades de venda.

A aplicação permite centralizar informações de contato, registrar o histórico de interações com clientes, criar e acompanhar oportunidades comerciais e visualizar o andamento das negociações em um funil de vendas.

Além disso, o sistema disponibiliza uma visão consolidada de cada cliente, reunindo seus dados cadastrais, interações realizadas e oportunidades associadas.

## Funcionalidades

O sistema implementa as seguintes histórias de usuário:

- **US01:** cadastrar clientes e leads com suas informações de contato.
- **US02:** visualizar e pesquisar clientes cadastrados.
- **US03:** atualizar os dados de um cliente.
- **US04:** registrar ligações, reuniões e outros contatos realizados com um cliente.
- **US05:** criar uma oportunidade de venda associada a um cliente.
- **US06:** alterar a etapa de uma oportunidade.
- **US07:** visualizar oportunidades organizadas por etapa em um pipeline comercial.
- **US08:** acessar uma visão consolidada do cliente, incluindo dados, interações e oportunidades.

## Tecnologias

- **Frontend:** React + Vite
- **Backend:** FastAPI
- **Linguagens:** JavaScript e Python
- **Banco de dados:** SQLite
- **ORM:** SQLAlchemy
- **Validação de dados:** Pydantic
- **Versionamento:** Git e GitHub
- **Agente de IA:** OpenAI Codex

## Arquitetura

```text
React
  ↓
API REST
  ↓
FastAPI
  ↓
SQLAlchemy
  ↓
SQLite
```

## Documentação UML

Os diagramas abaixo representam a estrutura final implementada no sistema e o fluxo de comunicação entre frontend, API e banco de dados.

### Diagrama de classes

```mermaid
classDiagram
    class Contact {
        int id
        string name
        string email
        string phone
        string company
        string type
    }

    class Opportunity {
        int id
        int client_id
        string title
        decimal value
        string stage
        date expected_close_date
        string notes
        datetime created_at
    }

    class Interaction {
        int id
        int contact_id
        string type
        string description
        datetime occurred_at
    }

    Contact "1" --> "0..*" Opportunity : possui
    Contact "1" --> "0..*" Interaction : possui
```

No backend, `Opportunity.client_id` referencia `Contact.id`, enquanto `Interaction.contact_id` também referencia `Contact.id`. No frontend, o serviço de API adapta `contact_id` para `client_id` ao carregar interações, mantendo o contrato esperado pelos componentes React.

### Diagrama de sequência: criação de oportunidade

```mermaid
sequenceDiagram
    actor Vendedor
    participant Form as Formulario React
    participant Service as Servico de API
    participant API as FastAPI
    participant ORM as SQLAlchemy
    participant DB as SQLite

    Vendedor->>Form: Preenche oportunidade e seleciona cliente
    Form->>Form: Valida os campos

    alt Campos validos
        Form->>Service: createOpportunity(dados)
        Service->>API: POST /opportunities
        API->>API: Valida dados com Pydantic
        API->>ORM: Cria objeto Opportunity
        ORM->>DB: INSERT opportunity
        DB-->>ORM: Registro persistido
        ORM-->>API: Opportunity criada
        API-->>Service: Oportunidade criada
        Service-->>Form: Retorna oportunidade
        Form-->>Vendedor: Atualiza o funil de vendas
    else Campos invalidos
        Form-->>Vendedor: Exibe mensagem de validacao
    end
```
