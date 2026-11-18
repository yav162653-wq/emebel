export type SeedPolicyEnvironment = {
  [key: string]: string | undefined;
  NODE_ENV?: string;
  SEED_DEMO_DATA?: string;
  DATABASE_URL?: string;
};

export class SeedPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SeedPolicyError";
  }
}

export function isLocalDatabaseUrl(databaseUrl: string | undefined): boolean {
  if (!databaseUrl) return false;

  try {
    const url = new URL(databaseUrl);
    return ["localhost", "127.0.0.1", "::1"].includes(
      url.hostname.toLowerCase(),
    );
  } catch {
    return false;
  }
}

export function assertSeedPolicy(
  environment: SeedPolicyEnvironment,
): void {
  if (environment.NODE_ENV === "production") {
    throw new SeedPolicyError(
      "Demo seed execution is prohibited when NODE_ENV=production",
    );
  }

  if (environment.SEED_DEMO_DATA !== "true") {
    throw new SeedPolicyError(
      "Demo seed execution is disabled; set SEED_DEMO_DATA=true explicitly",
    );
  }

  if (
    environment.NODE_ENV !== "development"
    && environment.NODE_ENV !== "test"
  ) {
    throw new SeedPolicyError(
      "Demo seed execution is allowed only in development or test",
    );
  }

  if (!isLocalDatabaseUrl(environment.DATABASE_URL)) {
    throw new SeedPolicyError(
      "Demo seed execution is restricted to local test or development databases",
    );
  }
}

export async function runSeedOnlyWhenAllowed<T>(
  environment: SeedPolicyEnvironment,
  seedAction: () => Promise<T>,
): Promise<T> {
  assertSeedPolicy(environment);
  return seedAction();
}
