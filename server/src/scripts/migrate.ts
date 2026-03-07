import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { join } from "node:path";
import { DatabaseController } from "../database/database.controller";

const run = async () => {
  const argv = await yargs(hideBin(process.argv))
    .scriptName("migrate")
    .usage("$0 [options]")
    .option("database", {
      alias: "d",
      type: "string",
      demandOption: true,
      describe: "Path to the SQLite database file",
    })
    .option("dry", {
      type: "boolean",
      default: false,
      describe: "Print applied and pending migrations only; do not run pending",
    })
    .help()
    .parse();

  const databasePath = argv.database;
  const dryRun = argv.dry;

  const migrationsPath = join(process.cwd(), "src", "database", "migrations");
  const controller = new DatabaseController(databasePath);
  controller.createMigrationsTable();

  try {
    const { applied, pending } =
      await controller.getMigrationStatus(migrationsPath);

    console.log("Applied migrations:");
    if (applied.length === 0) {
      console.log("  (none)");
    } else {
      for (const name of applied) {
        console.log(`  ${name}`);
      }
    }

    console.log("\nPending migrations:");
    if (pending.length === 0) {
      console.log("  (none)");
    } else {
      for (const name of pending) {
        console.log(`  ${name}`);
      }
    }

    if (dryRun) {
      console.log("\nDry run — no migrations executed.");
      return;
    }

    if (pending.length > 0) {
      console.log("\nRunning pending migrations...");
      await controller.runMigrations(migrationsPath);
      console.log(`Done. Applied ${pending.length} migration(s).`);
    }
  } finally {
    controller.close();
  }
};

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
