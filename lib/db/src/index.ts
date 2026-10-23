export interface TransactionalDatabase<TTransaction> {
  $transaction<T>(callback: (transaction: TTransaction) => Promise<T>): Promise<T>;
}

export async function inTransaction<TTransaction, T>(
  database: TransactionalDatabase<TTransaction>,
  callback: (transaction: TTransaction) => Promise<T>,
): Promise<T> {
  return database.$transaction(callback);
}