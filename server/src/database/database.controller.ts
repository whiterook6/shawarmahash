import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { DatabaseSync, StatementSync } from "node:sqlite";

export class DatabaseController {
  private database: DatabaseSync;

  private SELECT_1: StatementSync;
  /** Prepared after createMigrationsTable() is called. */
  private SELECT_MIGRATIONS!: StatementSync;
  /** Prepared after createMigrationsTable() is called. */
  private INSERT_MIGRATION!: StatementSync;
  private isInTransaction: boolean = false;

  constructor(databasePath: string) {
    this.database = new DatabaseSync(databasePath);
    this.database.exec("PRAGMA foreign_keys = ON");
    this.SELECT_1 = this.database.prepare("SELECT 1");
  }

  transaction(fn: () => void): void {
    if (this.isInTransaction) {
      throw new Error("Nested transactions are not supported");
    }
    this.isInTransaction = true;
    this.database.exec("BEGIN");
    try {
      fn();
      this.database.exec("COMMIT");
    } catch (err) {
      this.database.exec("ROLLBACK");
      throw err;
    } finally {
      this.isInTransaction = false;
    }
  }

  /**
   * Returns true if the database is open and can execute a query (e.g. for healthchecks).
   * Returns false if the connection is closed or the database is not responsive.
   */
  isReady(): boolean {
    try {
      this.SELECT_1.get();
      return true;
    } catch {
      return false;
    }
  }

  createMigrationsTable(): void {
    this.database.exec(`CREATE TABLE IF NOT EXISTS migrations (
      filename TEXT NOT NULL PRIMARY KEY,
      applied_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`);
    this.SELECT_MIGRATIONS = this.database.prepare(
      "SELECT filename FROM migrations",
    );
    this.INSERT_MIGRATION = this.database.prepare(
      "INSERT INTO migrations (filename, applied_at) VALUES (?, unixepoch())",
    );
  }

  getExistingMigrations(): string[] {
    const rows = this.SELECT_MIGRATIONS.all() as { filename: string }[];
    return rows.map((r) => r.filename).sort();
  }

  async getAllMigrationsInDirectory(migrationsPath: string): Promise<string[]> {
    const entries = await readdir(migrationsPath, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith(".sql"))
      .map((e) => e.name)
      .sort();
  }

  async getPendingMigrations(migrationsPath: string): Promise<string[]> {
    const existing = this.getExistingMigrations();
    const existingSet = new Set(existing);
    const all = await this.getAllMigrationsInDirectory(migrationsPath);
    return all.filter((f) => !existingSet.has(f));
  }

  async getMigrationStatus(migrationsPath: string): Promise<{
    applied: string[];
    pending: string[];
  }> {
    const applied = this.getExistingMigrations();
    const all = await this.getAllMigrationsInDirectory(migrationsPath);
    const existingSet = new Set(applied);
    const pending = all.filter((f) => !existingSet.has(f));
    return { applied, pending };
  }

  async runMigrations(migrationsPath: string): Promise<void> {
    const pending = await this.getPendingMigrations(migrationsPath);

    for (const filename of pending) {
      const filePath = join(migrationsPath, filename);
      const sql = await readFile(filePath, "utf-8");

      this.transaction(() => {
        this.database.exec(sql);
        this.INSERT_MIGRATION.run(filename);
      });
    }
  }

  close(): void {
    try {
      this.database.close();
    } catch (error) {
      console.error("[Database] Error closing database:", error);
    }
  }

  prepare(sql: string): StatementSync {
    return this.database.prepare(sql);
  }
}
