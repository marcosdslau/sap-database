/**
 * Exemplo de uso da biblioteca sap-database
 * 
 * Este arquivo demonstra como usar a classe Database para conectar
 * e executar queries em diferentes tipos de bancos de dados SAP.
 */

import { Database, DatabaseType } from './src/index';

async function exemplo() {
  const db = new Database();

  try {
    // Exemplo 1: Conectar ao Microsoft SQL Server
    console.log('Conectando ao banco de dados...');
    await db.connect({
      server: 'localhost:1433',
      database: 'meu_banco',
      username: 'sa',
      password: 'senha123',
      databaseType: DatabaseType.MSSQL,
      timeout: 600000,
    });

    // Exemplo 2: Executar uma query simples
    console.log('Executando query...');
    const usuarios = await db.executeQuery(
      'SELECT * FROM usuarios WHERE idade > ?',
      [18]
    );
    console.log('Usuários encontrados:', usuarios);

    // Exemplo 3: Executar uma stored procedure
    console.log('Executando stored procedure...');
    const resultadoProc = await db.executeProcedure('sp_buscar_usuario', [123]);
    console.log('Resultado da procedure:', resultadoProc);

    // Exemplo 4: Usar placeholder {db} na query
    const tabelas = await db.executeQuery('SELECT * FROM {db}.sys.tables');
    console.log('Tabelas do banco:', tabelas);

    // Exemplo 5: Desconectar
    console.log('Desconectando...');
    await db.disconnect();
    console.log('Desconectado com sucesso!');

  } catch (error) {
    console.error('Erro:', error);
    await db.disconnect().catch(() => {});
  }
}

// Exemplo com SAP HANA
async function exemploHana() {
  const db = new Database();

  try {
    await db.connect({
      server: 'hana-server:30015',
      database: 'MEU_SCHEMA',
      username: 'SYSTEM',
      password: 'senha123',
      databaseType: DatabaseType.HANA,
    });

    const resultados = await db.executeQuery(
      'SELECT * FROM "MEU_SCHEMA"."TABELA" WHERE ID = ?',
      [1]
    );

    console.log('Resultados HANA:', resultados);
    await db.disconnect();
  } catch (error) {
    console.error('Erro HANA:', error);
    await db.disconnect().catch(() => {});
  }
}

// Exemplo com PostgreSQL
async function exemploPostgres() {
  const db = new Database();

  try {
    await db.connect({
      server: 'localhost:5432',
      database: 'meu_banco',
      username: 'postgres',
      password: 'senha123',
      databaseType: DatabaseType.POSTGRES,
      poolSettings: {
        max: 20,
        min: 5,
      },
    });

    const resultados = await db.executeQuery(
      'SELECT * FROM usuarios WHERE email = $1',
      ['usuario@example.com']
    );

    console.log('Resultados PostgreSQL:', resultados);
    await db.disconnect();
  } catch (error) {
    console.error('Erro PostgreSQL:', error);
    await db.disconnect().catch(() => {});
  }
}

// Descomente para executar os exemplos:
// exemplo();
// exemploHana();
// exemploPostgres();

