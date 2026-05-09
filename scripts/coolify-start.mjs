import { spawn } from "node:child_process";

const migrateRetries = Number(process.env.PRISMA_MIGRATE_RETRIES ?? 12);
const migrateDelayMs = Number(process.env.PRISMA_MIGRATE_DELAY_MS ?? 5000);

function checkRequiredRuntimeConfig() {
  const warnings = [];
  const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
  const settingsSecret = process.env.SETTINGS_SECRET || "";

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    warnings.push("NEXT_PUBLIC_APP_URL is missing. Set it to your public domain.");
  }

  if (authSecret.length < 32 || authSecret.startsWith("change-this") || authSecret === "development-only-change-me") {
    warnings.push("AUTH_SECRET is missing or too short. Login cookies may fail.");
  }

  if (settingsSecret.length < 32 || settingsSecret.startsWith("change-this")) {
    warnings.push("SETTINGS_SECRET is missing or too short. Provider API settings cannot be safely encrypted.");
  }

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    warnings.push("ADMIN_EMAIL or ADMIN_PASSWORD is missing. Admin account initialization will be skipped.");
  }

  for (const warning of warnings) {
    console.warn(`Configuration warning: ${warning}`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: options.env ?? process.env,
      shell: process.platform === "win32",
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
      }
    });
  });
}

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL is missing. Starting the public site without database features.");
    console.warn("Registration, login, admin, orders, and cloud phone assignment require PostgreSQL.");
    console.warn("Configure DATABASE_URL in Coolify before real operation.");
    return false;
  }

  for (let attempt = 1; attempt <= migrateRetries; attempt += 1) {
    try {
      console.log(`Running Prisma migrations (${attempt}/${migrateRetries})...`);
      await run("npx", ["prisma", "migrate", "deploy"]);
      return true;
    } catch (error) {
      if (attempt === migrateRetries) {
        console.error("Prisma migrations failed after all retries. Starting the public site anyway so diagnostics stay available.");
        console.error(error);
        return false;
      }
      console.warn(`Migration failed, retrying in ${migrateDelayMs}ms...`);
      await sleep(migrateDelayMs);
    }
  }
}

checkRequiredRuntimeConfig();

const databaseReady = await runMigrations();

if (databaseReady && process.env.COOLIFY_INIT_ON_START === "true") {
  console.log("Running safe production initializer...");
  try {
    await run("npm", ["run", "prisma:init"]);
  } catch (error) {
    console.error("Safe production initializer failed. Starting the public site anyway so /api/health can show diagnostics.");
    console.error(error);
  }
} else if (!databaseReady && process.env.COOLIFY_INIT_ON_START === "true") {
  console.warn("Skipping prisma:init because the database is not ready.");
}

await run("npx", ["next", "start", "-H", process.env.HOSTNAME || "0.0.0.0", "-p", process.env.PORT || "3000"]);
