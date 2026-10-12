// Shared plumbing for the stage -> prod engine migration (scripts/migrate/*).
//
// Every script here reads two URIs from the env file passed via --env-file
// (see scripts/migrate/env.example). Nothing reads MONGODB_URI, so a value
// exported in the shell cannot silently redirect a run.
//
// Guards, enforced before any read or write:
//   - the SOURCE database must be `fisense-staging`;
//   - the TARGET database name must equal --confirm-db=<name>;
//   - source and target must be different databases.
//
// Scripts are dry runs unless --commit is passed.

import mongoose from "mongoose";

export const EXPECTED_SOURCE_DB = "fisense-staging";

export const COMMIT = process.argv.includes("--commit");

export function readValueFlag(name: string): string | null {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

export type Db = mongoose.mongo.Db;

function hostOf(uri: string): string {
  return uri.replace(/^mongodb(\+srv)?:\/\/([^@]*@)?/, "").split("/")[0];
}

async function open(uri: string): Promise<mongoose.Connection> {
  // autoIndex/autoCreate off: registering a model on this connection must never
  // build indexes or create collections behind a dry run's back.
  return mongoose
    .createConnection(uri, { autoIndex: false, autoCreate: false })
    .asPromise();
}

export interface Dbs {
  source: Db | null;
  target: Db;
  targetConn: mongoose.Connection;
  targetUri: string;
  close: () => Promise<void>;
}

export async function openDbs(
  script: string,
  { needSource }: { needSource: boolean },
): Promise<Dbs> {
  const targetUri = process.env.TARGET_MONGODB_URI;
  const sourceUri = process.env.SOURCE_MONGODB_URI;
  const confirm = readValueFlag("confirm-db");

  if (!targetUri) throw new Error("TARGET_MONGODB_URI is not set");
  if (needSource && !sourceUri) throw new Error("SOURCE_MONGODB_URI is not set");
  if (!confirm) throw new Error("pass --confirm-db=<target database name>");

  const targetConn = await open(targetUri);
  const target = targetConn.db!;
  const sourceConn = needSource ? await open(sourceUri!) : null;
  const source = sourceConn ? sourceConn.db! : null;

  const close = async () => {
    await targetConn.close();
    if (sourceConn) await sourceConn.close();
  };

  try {
    if (target.databaseName !== confirm) {
      throw new Error(
        `target database is "${target.databaseName}" but --confirm-db="${confirm}"`,
      );
    }
    if (source) {
      if (source.databaseName !== EXPECTED_SOURCE_DB) {
        throw new Error(
          `source database is "${source.databaseName}", expected "${EXPECTED_SOURCE_DB}"`,
        );
      }
      if (
        source.databaseName === target.databaseName &&
        hostOf(sourceUri!) === hostOf(targetUri)
      ) {
        throw new Error("source and target are the same database");
      }
    }
  } catch (err) {
    await close();
    throw err;
  }

  console.log(`[${script}] ${COMMIT ? "MODE: COMMIT" : "MODE: DRY RUN (pass --commit to apply)"}`);
  if (source) console.log(`  source: ${source.databaseName} @ ${hostOf(sourceUri!)}`);
  console.log(`  target: ${target.databaseName} @ ${hostOf(targetUri)}\n`);

  return { source, target, targetConn, targetUri, close };
}

export function run(script: string, main: () => Promise<void>) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`[${script}] FAILED:`, err instanceof Error ? err.message : err);
      process.exit(1);
    });
}

// Stable JSON for "did this document change" comparisons: key order must not
// count as a difference.
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_k, v) =>
    v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date) &&
    !(v as { _bsontype?: string })._bsontype
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
