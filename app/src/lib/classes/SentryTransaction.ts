import { startTransaction, type Span, type Transaction } from '@sentry/svelte';

export default class SentryTransaction {
  transaction: Transaction;
  span: Span;

  constructor(name: string, op: string, data?: object, description?: string) {
    this.transaction = startTransaction({
      name,
      data,
      description,
    });
    this.span = this.transaction.startChild({ op });
  }

  public finish() {
    this.span.finish();
    this.transaction.finish();
  }

  public setTag(
    key: string,
    value: string | number | bigint | boolean | symbol | null | undefined
  ) {
    this.span.setTag(key, value);
  }

  public setData(key: string, value: any) {
    this.span.setData(key, value);
  }
}
