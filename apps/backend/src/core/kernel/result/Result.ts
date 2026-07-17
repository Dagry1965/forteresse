export class Result<T> {
  public readonly isSuccess: boolean;
  public readonly error?: string;
  private readonly value?: T;

  private constructor(isSuccess: boolean, value?: T, error?: string) {
    this.isSuccess = isSuccess;
    this.value = value;
    this.error = error;
  }

  static ok<T>(value?: T): Result<T> {
    return new Result<T>(true, value);
  }

  static fail<T>(error: string): Result<T> {
    return new Result<T>(false, undefined, error);
  }

  getValue(): T {
    if (!this.isSuccess) {
      throw new Error("Cannot retrieve value from a failed result.");
    }

    return this.value as T;
  }
}