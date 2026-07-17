import { Result } from "../result/Result";

export class Guard {

  static againstNullOrUndefined(
    value: unknown,
    name: string
  ): Result<void> {

    if (value === null || value === undefined) {
      return Result.fail(`${name} is required`);
    }

    return Result.ok();

  }

}