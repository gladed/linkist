/** A value that is only created when accessed. */
export interface Lazy<T> {
    readonly value: T;
    readonly hasValue: boolean;

    /** Returns a {@link Lazy} transforming this value into another. */
    map<R>(f: (x: T) => R): Lazy<R>;
}

/** Wraps a function that returns a value as a {@link Lazy}. */
export function lazy<T>(getValue: () => T): Lazy<T> {
    return new LazyValue<T>(getValue);
}

/** Internal implementation of a {@link Lazy}. */
class LazyValue<T> implements Lazy<T> {
    private _hasValue = false;
    private _value?: T;

    constructor(
        private readonly getValue: () => T
    ) { }

    get value(): T {
        if (!this._hasValue) {
            this._hasValue = true;
            this._value = this.getValue();
        }
        return this._value!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    }

    get hasValue(): boolean {
        return this._hasValue;
    }

    public map<R>(f: (x: T) => R): Lazy<R> {
        return new LazyValue(() => f(this.value));
    }
}
