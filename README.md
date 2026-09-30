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

Os diagramas abaixo representam o modelo usado pelo frontend e o contrato
proposto. Precisam de revisão da equipe e alinhamento com o backend real.

### Diagrama de classes

```mermaid
classDiagram
    class Cliente {
        int id
        string name
        string company
        string type
        string email
        string phone
    }
    class Oportunidade {
        string id
        int client_id
        string title
        decimal value
        string stage
        date expected_close_date
        string notes
        datetime created_at
    }
    class Interacao {
        int id
        int client_id
        string type
        string description
        datetime occurred_at
    }
    Cliente "1" --> "0..*" Oportunidade : possui
    Cliente "1" --> "0..*" Interacao : possui
```

### Diagrama de sequência: criação de oportunidade

```mermaid
sequenceDiagram
    actor Vendedor
    participant Form as Formulario React
    participant Service as Servico CRM
    participant API as FastAPI (proposto)
    participant DB as Banco de dados (proposto)
    Vendedor->>Form: Preenche oportunidade e seleciona cliente
    Form->>Form: Valida campos
    alt Campos validos
        Form->>Service: createOpportunity(dados)
        alt Modo demonstracao
            Service->>Service: Salva no localStorage
        else Modo API (integracao pendente)
            Service->>API: POST /opportunities
            API->>DB: Valida e persiste
            DB-->>API: Registro criado
            API-->>Service: Oportunidade com id
        end
        Service-->>Form: Oportunidade criada ou erro
        Form-->>Vendedor: Atualiza funil ou exibe erro
    else Campos invalidos
        Form-->>Vendedor: Indica campos a corrigir
    end
```
