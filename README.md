# sap-hanadatabase

Biblioteca reutilizável em TypeScript para conexão com banco de dados SAP HANA.

## Instalação

```bash
npm install sap-hanadatabase
```

**Nota:** As dependências de runtime são instaladas automaticamente quando você instala `sap-hanadatabase`. Não é necessário instalá-las manualmente!

## Dependências

Esta biblioteca utiliza as seguintes dependências de runtime (instaladas automaticamente):

- `@sap/hana-client` - Para conexão com SAP HANA
- `generic-pool` - Para gerenciamento de pool de conexões

Todas essas dependências são instaladas automaticamente quando você executa `npm install sap-hanadatabase`.

## Uso

### Importação

```typescript
import { Database } from 'sap-hanadatabase';
```

### Exemplo Básico

```typescript
// Criar instância da Database com os parâmetros de conexão
const db = new Database({
  server: 'hana-server:30015',
  database: 'MEU_SCHEMA', // Opcional - schema padrão
  username: 'SYSTEM',
  password: 'senha',
  timeout: 600000, // opcional, padrão: 600000ms
  poolSettings: { // opcional
    max: 10,
    min: 5
  }
});

// Conectar ao banco de dados
await db.connect();

// Executar uma query
const resultados = await db.query(
  'SELECT * FROM "MEU_SCHEMA"."TABELA" WHERE ID = ?',
  [1]
);

// Executar uma stored procedure
const resultadoProc = await db.procedure('SP_BUSCAR_USUARIO', [123]);

// Desconectar
await db.disconnect();
```

### Construtor

#### `new Database(params: DatabaseConnectionParams)`

Cria uma nova instância da classe Database com os parâmetros de conexão.

**Parâmetros:**
- `server`: Endereço do servidor HANA (pode incluir porta no formato `host:port`)
- `database`: Nome do schema (opcional)
- `username`: Nome de usuário
- `password`: Senha do usuário
- `timeout`: Timeout em milissegundos (opcional, padrão: 600000)
- `poolSettings`: Configurações adicionais do pool de conexões (opcional)

### Métodos da Classe Database

#### `connect(): Promise<void>`

Conecta ao banco de dados SAP HANA usando os parâmetros fornecidos no construtor.

**Lança:** `Error` se houver erro na conexão

#### `query(query: string, parameters?: unknown[]): Promise<QueryResult>`

Executa uma query SQL diretamente no banco de dados HANA.

**Parâmetros:**
- `query`: Query SQL a ser executada (pode usar `{db}` como placeholder para o nome do schema)
- `parameters`: Array de parâmetros para a query (opcional, padrão: `[]`)

**Retorna:** Promise com o resultado da query

**Lança:** `Error` se houver erro na execução da query ou se não houver conexão ativa

#### `procedure(name: string, parameters?: unknown[]): Promise<QueryResult>`

Executa uma stored procedure no banco de dados HANA.

**Parâmetros:**
- `name`: Nome da stored procedure
- `parameters`: Array de parâmetros para a procedure (opcional, padrão: `[]`)

**Retorna:** Promise com o resultado da execução da procedure

**Lança:** `Error` se houver erro na execução da procedure ou se não houver conexão ativa

#### `disconnect(): Promise<void>`

Desconecta do banco de dados HANA e fecha todas as conexões do pool.

**Lança:** `Error` se houver erro ao desconectar

### Exemplos

#### Exemplo com Schema

```typescript
const db = new Database({
  server: '192.168.1.100:30015',
  database: 'SBO_CMM',
  username: 'SYSTEM',
  password: 'senha123',
});

await db.connect();

// Usar placeholder {db} na query
const resultados = await db.query('SELECT * FROM {db}."TABELA"');

await db.disconnect();
```

#### Exemplo sem Schema Padrão

```typescript
const db = new Database({
  server: '192.168.1.100:30015',
  username: 'SYSTEM',
  password: 'senha123',
});

await db.connect();

// Especificar schema completo na query
const resultados = await db.query('SELECT * FROM "MEU_SCHEMA"."TABELA"');

await db.disconnect();
```

#### Exemplo com Stored Procedure

```typescript
const db = new Database({
  server: '192.168.1.100:30015',
  database: 'SBO_CMM',
  username: 'SYSTEM',
  password: 'senha123',
});

await db.connect();

// Executar stored procedure
const resultado = await db.procedure('SP_BUSCAR_CLIENTE', [123, 'ATIVO']);

await db.disconnect();
```

#### Exemplo com Pool Customizado

```typescript
const db = new Database({
  server: '192.168.1.100:30015',
  database: 'SBO_CMM',
  username: 'SYSTEM',
  password: 'senha123',
  timeout: 300000,
  poolSettings: {
    max: 20,
    min: 10,
  },
});

await db.connect();
```


## Licença

ISC
