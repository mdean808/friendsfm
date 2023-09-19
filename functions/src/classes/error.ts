export class CustomError extends Error {
  custom: boolean;
  constructor(message?: string) {
    super(message);
    this.custom = true;
  }
}
