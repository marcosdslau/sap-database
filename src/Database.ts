import * as hana from "@sap/hana-client";
import { createPool, Pool as GenericPool } from "generic-pool";
import {
  DatabaseConnectionParams,
  PoolSettings,
  HanaClient,
  HanaConnectionParams,
  QueryResult,
} from "./types";

/**
 * Classe principal para gerenciamento de conexões com SAP HANA
 */
export class Database {
  private database: string;
  private username: string;
  private password: string;
  private server: string;
  private timeout: number;
  private poolSettings?: PoolSettings;

  // Pool de conexões HANA
  private pool?: GenericPool<HanaClient>;

  /**
   * Construtor da classe Database
   * @param params Parâmetros de conexão com o banco de dados SAP HANA
   * @throws {Error} Se os parâmetros forem inválidos
   */
  constructor(params: DatabaseConnectionParams) {
    if (!params.server || !params.server.trim()) {
      throw new Error("Parâmetro 'server' é obrigatório");
    }
    if (!params.username || !params.username.trim()) {
      throw new Error("Parâmetro 'username' é obrigatório");
    }
    if (!params.password || !params.password.trim()) {
      throw new Error("Parâmetro 'password' é obrigatório");
    }

    this.database = params.database || "";
    this.username = params.username;
    this.password = params.password;
    this.server = params.server;
    this.timeout = params.timeout ?? 600000;
    this.poolSettings = params.poolSettings;
  }

  /**
   * Conecta ao banco de dados SAP HANA usando os parâmetros fornecidos no construtor
   * @throws {Error} Se houver erro na conexão
   */
  async connect(): Promise<void> {
    try {
      await this.setConnDbHana();
    } catch (error) {
      throw new Error(
        `Erro ao conectar ao banco de dados HANA: ${error instanceof Error ? error.message : String(error)}`
      );
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
      communicationTimeout: this.timeout,
    };

    // Adicionar currentSchema apenas se o database foi fornecido e não estiver vazio
    if (this.database && this.database.trim() !== "") {
      conn_params.currentSchema = this.database;
    }

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

    // Testar a conexão adquirindo um cliente do pool
    // Se a conexão falhar, o pool já rejeitará na criação do cliente
    const client = await this.pool.acquire();
    this.pool.release(client);
  }

  /**
   * Executa uma query SQL diretamente no banco de dados HANA
   * @param query Query SQL a ser executada (pode usar {db} como placeholder para o nome do schema)
   * @param parameters Array de parâmetros para a query (padrão: [])
   * @returns Promise com o resultado da query
   * @throws {Error} Se houver erro na execução da query ou se não houver conexão ativa
   */
  async query(query: string, parameters: unknown[] = []): Promise<QueryResult> {
    if (!this.pool) {
      throw new Error("Não há conexão ativa com o banco de dados. Execute connect() primeiro.");
    }

    // Substituir placeholder {db} pelo nome do schema se fornecido
    const q = this.database ? query.replace(/{db}/g, this.database) : query;

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

  /**
   * Executa uma stored procedure no banco de dados HANA
   * @param name Nome da stored procedure
   * @param parameters Array de parâmetros para a procedure (padrão: [])
   * @returns Promise com o resultado da execução da procedure
   * @throws {Error} Se houver erro na execução da procedure ou se não houver conexão ativa
   */
  async procedure(name: string, parameters: unknown[] = []): Promise<QueryResult> {
    if (!this.pool) {
      throw new Error("Não há conexão ativa com o banco de dados. Execute connect() primeiro.");
    }

    const placeholders = parameters.map(() => "?").join(",");
    const schemaPrefix = this.database ? `{db}.` : "";
    const query = `CALL ${schemaPrefix}"${name}"(${placeholders})`;

    return this.query(query, parameters);
  }

  /**
   * Desconecta do banco de dados HANA e fecha todas as conexões do pool
   * @throws {Error} Se houver erro ao desconectar
   */
  async disconnect(): Promise<void> {
    try {
      if (this.pool) {
        await this.pool.drain();
        await this.pool.clear();
        this.pool = undefined;
      }
    } catch (error) {
      throw new Error(
        `Erro ao desconectar do banco de dados: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
