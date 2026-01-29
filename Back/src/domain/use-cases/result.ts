export class Result<T, E = string> {
  private constructor(
    private readonly value?: T,
    private readonly error?: E,
    private readonly _isOk: boolean = true,
  ) {}

  static ok<T, E = string>(value: T): Result<T, E> {
    return new Result<T, E>(value, undefined, true);
  }

  static fail<T, E = string>(error: E): Result<T, E> {
    return new Result<T, E>(undefined, error, false);
  }

  isOk(): boolean {
    return this._isOk;
  }

  isFailure(): boolean {
    return !this._isOk;
  }

  getValue(): T {
    if (!this._isOk) {
      throw new Error('Cannot get value of a failed result');
    }
    return this.value as T;
  }

  getError(): E {
    if (this._isOk) {
      throw new Error('Cannot get error of a successful result');
    }
    return this.error as E;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this._isOk) {
      return Result.ok<U, E>(fn(this.value as T));
    }
    return Result.fail<U, E>(this.error as E);
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this._isOk) {
      return fn(this.value as T);
    }
    return Result.fail<U, E>(this.error as E);
  }

  static combine<E = string>(results: Result<unknown, E>[]): Result<void, E> {
    for (const result of results) {
      if (result.isFailure()) {
        return Result.fail<void, E>(result.getError());
      }
    }
    return Result.ok<void, E>(undefined);
  }
}
