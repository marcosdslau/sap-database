# sap-database

Biblioteca reutilizável em TypeScript para conexão com bancos de dados SAP (HANA, MSSQL, PostgreSQL).

## Instalação

```bash
npm install sap-database
```

**Nota:** As dependências de runtime são instaladas automaticamente quando você instala `sap-database`. Não é necessário instalá-las manualmente!

## Dependências

Esta biblioteca utiliza as seguintes dependências de runtime (instaladas automaticamente):

- `@sap/hana-client` - Para conexão com SAP HANA
- `mssql` - Para conexão com Microsoft SQL Server
- `pg` - Para conexão com PostgreSQL
- `generic-pool` - Para gerenciamento de pool de conexões

Todas essas dependências são instaladas automaticamente quando você executa `npm install sap-database`.

## Uso

### Importação

```typescript
import { Database, DatabaseType } from 'sap-database';
```

### Exemplo Básico

```typescript
const db = new Database();

// Conectar ao banco de dados
await db.connect({
  server: 'localhost:1433',
  database: 'meu_banco',
  username: 'usuario',
  password: 'senha',
  databaseType: DatabaseType.MSSQL,
  timeout: 600000, // opcional, padrão: 600000ms
  poolSettings: { // opcional
    max: 10,
    min: 5
  }
});

// Executar uma query
const resultados = await db.executeQuery(
  'SELECT * FROM usuarios WHERE idade > ?',
  [18]
);

// Executar uma stored procedure
const resultadoProc = await db.executeProcedure('sp_buscar_usuario', [123]);

// Desconectar
await db.disconnect();
```

### Tipos de Banco de Dados Suportados

```typescript
enum DatabaseType {
  HANA = "HANA",
  MSSQL = "MSSQL",
  POSTGRES = "POSTGRES"
}
```

### Métodos da Classe Database

#### `connect(params: DatabaseConnectionParams): Promise<void>`

Conecta ao banco de dados usando os parâmetros fornecidos.

**Parâmetros:**
- `server`: Endereço do servidor (pode incluir porta no formato `host:port`)
- `database`: Nome do banco de dados
- `username`: Nome de usuário
- `password`: Senha do usuário
- `databaseType`: Tipo de banco de dados (`DatabaseType` ou string)
- `timeout`: Timeout em milissegundos (opcional, padrão: 600000)
- `poolSettings`: Configurações adicionais do pool de conexões (opcional)

#### `executeQuery(query: string, parameters?: unknown[]): Promise<QueryResult>`

Executa uma query SQL diretamente no banco de dados.

**Parâmetros:**
- `query`: Query SQL a ser executada (pode usar `{db}` como placeholder para o nome do banco)
- `parameters`: Array de parâmetros para a query (opcional, padrão: `[]`)

**Retorna:** Promise com o resultado da query

#### `executeProcedure(name: string, parameters?: unknown[]): Promise<QueryResult>`

Executa uma stored procedure no banco de dados.

**Parâmetros:**
- `name`: Nome da stored procedure
- `parameters`: Array de parâmetros para a procedure (opcional, padrão: `[]`)

**Retorna:** Promise com o resultado da execução da procedure

#### `disconnect(): Promise<void>`

Desconecta do banco de dados e fecha todas as conexões.

### Exemplos por Tipo de Banco

#### SAP HANA

```typescript
const db = new Database();
await db.connect({
  server: 'hana-server:30015',
  database: 'MEU_SCHEMA',
  username: 'SYSTEM',
  password: 'senha',
  databaseType: DatabaseType.HANA
});
```

#### Microsoft SQL Server

```typescript
const db = new Database();
await db.connect({
  server: 'localhost:1433',
  database: 'meu_banco',
  username: 'sa',
  password: 'senha',
  databaseType: DatabaseType.MSSQL
});
```

#### PostgreSQL

```typescript
const db = new Database();
await db.connect({
  server: 'localhost:5432',
  database: 'meu_banco',
  username: 'postgres',
  password: 'senha',
  databaseType: DatabaseType.POSTGRES
});
```

## Desenvolvimento

### Build

```bash
npm run build
```

### Estrutura do Projeto

```
sap-database/
├── src/
│   ├── Database.ts      # Classe principal Database
│   ├── types.ts         # Tipos e interfaces TypeScript
│   └── index.ts         # Arquivo de entrada (exports)
├── dist/                # Arquivos compilados (gerado após build)
├── package.json
├── tsconfig.json
└── README.md
```

## Licença

ISC
