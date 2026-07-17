import { Entity } from "./Entity";

export abstract class AggregateRoot<T> extends Entity<T> {

  protected constructor(props: T) {
    super(props);
  }

}