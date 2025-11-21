import { Pool as PgPool } from "pg";
import { ConnectionPool } from "mssql";
import { Pool } from "generic-pool";

/**
 * Tipos de banco de dados suportados
 */
export enum DatabaseType {
  HANA = "HANA",
  MSSQL = "MSSQL",
  POSTGRES = "POSTGRES",
}

/**
 * Configurações de pool de conexões
 */
export interface PoolSettings {
  max?: number;
  min?: number;
  [key: string]: unknown;
}

/**
 * Parâmetros de conexão com o banco de dados
 */
export interface DatabaseConnectionParams {
  /** Endereço do servidor (pode incluir porta no formato host:port) */
  server: string;
  /** Nome do banco de dados */
  database: string;
  /** Nome de usuário */
  username: string;
  /** Senha do usuário */
  password: string;
  /** Tipo de banco de dados */
  databaseType: DatabaseType | string;
  /** Timeout em milissegundos (padrão: 600000) */
  timeout?: number;
  /** Configurações adicionais do pool de conexões */
  poolSettings?: PoolSettings;
}

/**
 * Cliente de conexão HANA
 */
export interface HanaClient {
  connect(params: HanaConnectionParams, callback?: (err?: Error) => void): void;
  exec(query: string, params: unknown[], callback: (err: Error | null, result: unknown) => void): void;
  disconnect(): void;
}

/**
 * Parâmetros de conexão HANA
 */
export interface HanaConnectionParams {
  serverNode: string;
  UID: string;
  PWD: string;
  currentSchema: string;
  communicationTimeout: number;
}

/**
 * Resultado de uma query
 */
export type QueryResult = unknown[] | Record<string, unknown>[];

