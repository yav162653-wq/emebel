import { db } from "../../../db/client";
import type {
  ExternalAuthTransactionStore,
  ExternalAuthTransaction,
  ExternalAuthProviderName,
} from "../domain/external-auth";

export class PrismaExternalAuthTransactionStore implements ExternalAuthTransactionStore {
  async create(transaction: ExternalAuthTransaction): Promise<void> {
    await db.externalAuthTransaction.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { consumedAt: { not: null } },
        ],
      },
    });
    await db.externalAuthTransaction.create({ data: transaction });
  }

  async consume(input: {
    provider: ExternalAuthProviderName;
    stateHash: string;
    now: Date;
  }): Promise<{ userId: number | null } | null> {
    const transaction = await db.externalAuthTransaction.findUnique({
      where: { stateHash: input.stateHash },
    });
    if (
      !transaction
      || transaction.provider !== input.provider
      || transaction.consumedAt
      || transaction.expiresAt <= input.now
    ) {
      return null;
    }

    const claimed = await db.externalAuthTransaction.updateMany({
      where: {
        id: transaction.id,
        provider: input.provider,
        consumedAt: null,
        expiresAt: { gt: input.now },
      },
      data: { consumedAt: input.now },
    });
    if (claimed.count !== 1) return null;
    return { userId: transaction.userId };
  }
}
