export abstract class Entity<T> {

  protected readonly props: T;

  protected constructor(props: T) {
    this.props = props;
  }

}