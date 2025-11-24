/**
 * Exemplo de uso da biblioteca sap-database
 * 
 * Este arquivo demonstra como usar a classe Database para conectar
 * e executar queries no banco de dados SAP HANA.
 */

import { Database } from './src/index';

async function exemploBasico() {
  const db = new Database({
    server: 'localhost:30015',
    database: 'MEU_SCHEMA',
    username: 'SYSTEM',
    password: 'senha123',
  });

  try {
    // Conectar ao banco de dados
    console.log('Conectando ao banco de dados HANA...');
    await db.connect();
    console.log('Conectado com sucesso!');

    // Executar uma query simples de teste (sempre funciona no HANA)
    console.log('Executando query de teste...');
    const resultadoTeste = await db.query('SELECT CURRENT_SCHEMA FROM DUMMY');
    console.log('Schema atual:', resultadoTeste);

    // Executar query com parâmetros
    console.log('Executando query com parâmetros...');
    const resultadoParam = await db.query('SELECT ? AS valor FROM DUMMY', [123]);
    console.log('Resultado com parâmetro:', resultadoParam);

    // Usar placeholder {db} na query
    console.log('Executando query com placeholder {db}...');
    const tabelas = await db.query('SELECT CURRENT_SCHEMA FROM DUMMY WHERE CURRENT_SCHEMA = ?', ['MEU_SCHEMA']);
    console.log('Resultado com placeholder:', tabelas);

    // Exemplo de stored procedure (comentado pois pode não existir)
    // console.log('Executando stored procedure...');
    // const resultadoProc = await db.procedure('SP_EXEMPLO', [123]);
    // console.log('Resultado da procedure:', resultadoProc);

    // Desconectar
    console.log('Desconectando...');
    await db.disconnect();
    console.log('Desconectado com sucesso!');

  } catch (error) {
    console.error('Erro:', error);
    await db.disconnect().catch(() => {});
  }
}

async function exemploSemSchema() {
  const db = new Database({
    server: 'localhost:30015',
    username: 'SYSTEM',
    password: 'senha123',
  });

  try {
    await db.connect();

    // Especificar schema completo na query quando não há schema padrão
    const resultados = await db.query(
      'SELECT CURRENT_SCHEMA FROM DUMMY'
    );

    console.log('Resultados sem schema padrão:', resultados);
    await db.disconnect();
  } catch (error) {
    console.error('Erro:', error);
    await db.disconnect().catch(() => {});
  }
}

async function exemploComPoolCustomizado() {
  const db = new Database({
    server: 'localhost:30015',
    database: 'MEU_SCHEMA',
    username: 'SYSTEM',
    password: 'senha123',
    timeout: 300000,
    poolSettings: {
      max: 20,
      min: 10,
    },
  });

  try {
    await db.connect();
    console.log('Conectado com pool customizado');

    const resultados = await db.query('SELECT CURRENT_SCHEMA FROM DUMMY');
    console.log('Schema atual:', resultados);

    await db.disconnect();
  } catch (error) {
    console.error('Erro:', error);
    await db.disconnect().catch(() => {});
  }
}

// Descomente para executar os exemplos:
// exemploBasico();
// exemploSemSchema();
// exemploComPoolCustomizado();
