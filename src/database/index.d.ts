export interface DatabaseData<T> {
  [key: string]: T;
}

export interface DatabaseConfig {}

export interface DatabaseConnectionParams {}

export abstract class Database<T> {
  constructor(config: DatabaseConfig);

  connect(params: DatabaseConnectionParams): Promise<void>;
  disconnect(): Promise<void>;

  create(key: string, data: T): Promise<void>;
  read(key: string): Promise<T | undefined>;
  readAll(): Promise<DatabaseData<T>>;
  update(key: string, data: T): Promise<void>;
  delete(key: string): Promise<void>;
}
