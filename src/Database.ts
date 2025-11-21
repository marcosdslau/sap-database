import * as mssql from "mssql";
import * as hana from "@sap/hana-client";
import { Pool as PgPool } from "pg";
import { createPool, Pool as GenericPool } from "generic-pool";
import {
  DatabaseType,
  DatabaseConnectionParams,
  PoolSettings,
  HanaClient,
  HanaConnectionParams,
  QueryResult,
} from "./types";

/**
 * Classe principal para gerenciamento de conexões com bancos de dados SAP
 * Suporta HANA, MSSQL e PostgreSQL
 */
export class Database {
  private databaseType!: DatabaseType;
  private isHana!: boolean;
  private isPostgres!: boolean;
  private database!: string;
  private username!: string;
  private password!: string;
  private server!: string;
  private timeout!: number;
  private poolSettings?: PoolSettings;

  // Conexões específicas por tipo de banco
  private pool?: GenericPool<HanaClient>;
  private mssql?: mssql.ConnectionPool;
  private mssqlConnect?: Promise<mssql.ConnectionPool>;
  private pgPool?: PgPool;

  /**
   * Conecta ao banco de dados usando os parâmetros fornecidos
   * @param params Parâmetros de conexão com o banco de dados
   * @throws {Error} Se houver erro na conexão
   */
  async connect(params: DatabaseConnectionParams): Promise<void> {
    const databaseTypeStr = params.databaseType.toUpperCase();
    
    // Validação do tipo de banco
    if (!Object.values(DatabaseType).includes(databaseTypeStr as DatabaseType)) {
      throw new Error(
        `Tipo de banco de dados inválido: ${databaseTypeStr}. Tipos suportados: ${Object.values(DatabaseType).join(", ")}`
      );
    }

    this.databaseType = databaseTypeStr as DatabaseType;
    this.isHana = this.databaseType === DatabaseType.HANA;
    this.isPostgres = this.databaseType === DatabaseType.POSTGRES;
    this.database = params.database;
    this.username = params.username;
    this.password = params.password;
    this.server = params.server;
    this.timeout = params.timeout ?? 600000;
    this.poolSettings = params.poolSettings;

    try {
      if (this.isHana) {
        await this.setConnDbHana();
      } else if (this.isPostgres) {
        await this.setConnDbPostgres();
      } else {
        await this.setConnDbSql();
      }
    } catch (error) {
      throw new Error(`Erro ao conectar ao banco de dados: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Configura a conexão com SAP HANA
   * @private
   */
  private async setConnDbHana(): Promise<void> {
    const conn_params: HanaConnectionParams = {
      serverNode: this.server,
      UID: this.username,
      PWD: this.password,
      currentSchema: this.database,
      communicationTimeout: this.timeout,
    };

    const hanaFactory = {
      create: (): Promise<HanaClient> => {
        return new Promise((resolve, reject) => {
          const client = hana.createConnection() as HanaClient;
          client.connect(conn_params, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(client);
            }
          });
        });
      },
      destroy: (client: HanaClient): Promise<void> => {
        return new Promise((resolve) => {
          client.disconnect();
          resolve();
        });
      },
    };

    this.pool = createPool<HanaClient>(hanaFactory, {
      max: 10,
      min: 5,
      ...this.poolSettings,
    });
  }

  /**
   * Configura a conexão com Microsoft SQL Server
   * @private
   */
  private async setConnDbSql(): Promise<void> {
    let server = this.server;
    let port: number | undefined = undefined;

    if (this.server.includes(":")) {
      const serverSplitted = this.server.split(":");
      server = serverSplitted[0];
      port = +serverSplitted[1];
    }

    await new Promise<void>((resolve, reject) => {
      this.mssql = new mssql.ConnectionPool(
        {
          server: server,
          user: this.username,
          password: this.password,
          database: this.database,
          port: port,
          connectionTimeout: this.timeout,
          requestTimeout: this.timeout,
          options: {
            enableArithAbort: false,
          },
        },
        (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    if (!this.mssql) {
      throw new Error("Falha ao criar pool de conexão MSSQL");
    }

    this.mssqlConnect = this.mssql.connect();
  }

  /**
   * Configura a conexão com PostgreSQL
   * @private
   */
  private async setConnDbPostgres(): Promise<void> {
    let server = this.server;
    let port: number | undefined = undefined;

    if (this.server.includes(":")) {
      const serverSplitted = this.server.split(":");
      server = serverSplitted[0];
      port = +serverSplitted[1];
    }

    this.pgPool = new PgPool({
      host: server,
      user: this.username,
      password: this.password,
      database: this.database,
      port: port,
      idleTimeoutMillis: this.timeout,
      connectionTimeoutMillis: this.timeout,
      ...this.poolSettings,
    });
  }

  /**
   * Executa uma query SQL diretamente no banco de dados
   * @param query Query SQL a ser executada (pode usar {db} como placeholder para o nome do banco)
   * @param parameters Array de parâmetros para a query (padrão: [])
   * @returns Promise com o resultado da query
   * @throws {Error} Se houver erro na execução da query
   */
  async executeQuery(query: string, parameters: unknown[] = []): Promise<QueryResult> {
    if (!this.isHana && !this.isPostgres && !this.mssql) {
      throw new Error("Não há conexão ativa com o banco de dados. Execute connect() primeiro.");
    }

    const q = query.replace(/{db}/g, this.database);

    if (this.isHana) {
      if (!this.pool) {
        throw new Error("Pool HANA não inicializado");
      }

      return new Promise<QueryResult>((resolve, reject) => {
        this.pool!
          .acquire()
          .then((client) => {
            client.exec(q, parameters, (err, r) => {
              this.pool!.release(client);
              if (err) {
                reject(err);
              } else {
                resolve(r as QueryResult);
              }
            });
          })
          .catch(reject);
      });
    }

    if (this.isPostgres) {
      if (!this.pgPool) {
        throw new Error("Pool PostgreSQL não inicializado");
      }

      const client = await this.pgPool.connect();
      try {
        const result = await client.query(q, parameters);
        return result.rows;
      } finally {
        client.release();
      }
    }

    // MSSQL
    if (!this.mssql || !this.mssqlConnect) {
      throw new Error("Conexão MSSQL não inicializada");
    }

    let finalQuery = q;
    if (parameters.length > 0) {
      let i = 0;
      while (/\?/.test(finalQuery)) {
        finalQuery = finalQuery.replace("?", `@mssqlboundparm${i++}`);
      }
    }

    await this.mssqlConnect;

    if (parameters.length > 0) {
      const req = new mssql.Request(this.mssql);
      for (let i = 0; i < parameters.length; i++) {
        req.input(`mssqlboundparm${i}`, parameters[i]);
      }
      const result = await req.query(finalQuery);
      return result.recordset;
    }

    const result = await this.mssql.query(finalQuery);
    return result.recordset;
  }

  /**
   * Executa uma stored procedure no banco de dados
   * @param name Nome da stored procedure
   * @param parameters Array de parâmetros para a procedure (padrão: [])
   * @returns Promise com o resultado da execução da procedure
   * @throws {Error} Se houver erro na execução da procedure
   */
  async executeProcedure(name: string, parameters: unknown[] = []): Promise<QueryResult> {
    const placeholders = parameters.map(() => "?").join(",");
    let query: string;

    if (this.isHana) {
      query = `CALL {db}."${name}"(${placeholders})`;
    } else if (this.isPostgres) {
      query = `SELECT * FROM ${name}(${placeholders})`;
    } else {
      query = `EXEC "${name}" ${placeholders}`;
    }

    return this.executeQuery(query, parameters);
  }

  /**
   * Desconecta do banco de dados e fecha todas as conexões
   * @throws {Error} Se houver erro ao desconectar
   */
  async disconnect(): Promise<void> {
    try {
      if (this.isHana) {
        if (this.pool) {
          await this.pool.drain();
          await this.pool.clear();
        }
      } else if (this.isPostgres) {
        if (this.pgPool) {
          await this.pgPool.end();
        }
      } else {
        if (this.mssqlConnect) {
          await this.mssqlConnect;
          await this.mssql!.close();
        }
      }
    } catch (error) {
      throw new Error(
        `Erro ao desconectar do banco de dados: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

