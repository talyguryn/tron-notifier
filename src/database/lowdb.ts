import { Database, DatabaseData, DatabaseConfig, DatabaseConnectionParams } from './index';

import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'node:path';

export interface LowdbData<T> extends DatabaseData<T> {}

export interface LowdbConfig extends DatabaseConfig {
  pathToDbFolder: string;
}

export interface LowdbConnectionParams extends DatabaseConnectionParams {
  dbName: string;
}

export class LowdbDatabase<T> implements Database<T> {
  private db: Low<LowdbData<T>>;

  private pathToDbFolder: string = path.resolve();
  private dbName: string = 'db';

  constructor({ pathToDbFolder }: LowdbConfig) {
    this.pathToDbFolder = pathToDbFolder;
  }

  private getPathToDbFile(): string {
    const filename = `${this.dbName}.json`;

    return path.join(this.pathToDbFolder, filename);
  }

  async connect({ dbName }: LowdbConnectionParams): Promise<void> {
    this.dbName = dbName;

    const adapter = new JSONFile<LowdbData<T>>(this.getPathToDbFile());

    this.db = new Low<LowdbData<T>>(adapter, {});

    await this.db.read();
  }

  async disconnect(): Promise<void> {
    this.db = null;
  }

  public async create(key: string, data: T): Promise<void> {
    if (await this.read(key)) {
      return;
    }

    this.db.data[key] = data;
    await this.db.write();
  }

  public async read(key: string): Promise<T> {
    return this.db.data[key];
  }

  public async readAll(): Promise<LowdbData<T>> {
    return this.db.data;
  }

  public async update(key: string, data: T): Promise<void> {
    this.db.data[key] = data;

    await this.db.write();
  }

  public async delete(key: string): Promise<void> {
    delete this.db.data[key];

    await this.db.write();
  }
}
