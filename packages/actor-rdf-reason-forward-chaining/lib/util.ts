import { AsyncIterator, ArrayIterator, BufferedIterator, IntegerIterator, scheduleTask, SourceExpression, empty, fromArray, TransformIterator, TransformIteratorOptions } from './asynciterator';
import { EventEmitter } from 'events';

// Determines whether the given object is a promise
function isPromise<T>(object: any): object is Promise<T> {
  return object && typeof object.then === 'function';
}

/**
 * The WrappingIterator class can be used to wrap all supported kinds of data
 * sources, both promisified and not, into AsyncIterator instances.
 * This class is not meant to be used directly but, rather, through the
 * `wrap()` function as it provides the mechanism that allows the latter
 * to synchronously return an instance of AsyncIterator even for promisified
 * sources.
 */
 export class WrappingIterator<T> extends AsyncIterator<T> {
  protected _source?: any;

  constructor(sourceOrPromise?: WrapSource<T> | Promise<WrapSource<T>> | null, options: WrapOptions = {}) {
    super();
    this._onSourceEnd = this._onSourceEnd.bind(this);
    this._onSourceError = this._onSourceError.bind(this);
    this._onSourceReadable = this._onSourceReadable.bind(this);
    if (sourceOrPromise)
      this.setSource(sourceOrPromise, options);
  }

  setSource(sourceOrPromise: WrapSource<T> | Promise<WrapSource<T>>, options: WrapOptions = {}) {
    if (isPromise(sourceOrPromise)) {
      sourceOrPromise
        .then(source => this._wrapSource(source, options))
        .catch(err => this.emit('error', err));
    }
    else {
      this._wrapSource(sourceOrPromise, options);
    }
  }

  protected _wrapSource(source: WrapSource<T>, options: WrapOptions) {
    try {
      const wrappedSource: AsyncIterator<T> = source as AsyncIterator<T>;
      wrappedSource.on('end', this._onSourceEnd);
      wrappedSource.on('error', this._onSourceError);
      wrappedSource.on('readable', this._onSourceReadable);
      this._source = wrappedSource;
      this.readable = true;
    }
    catch (err) {
      scheduleTask(() => this.emit('error', err));
    }
  }

  protected _onSourceReadable() {
    this.emit('readable');
  }

  protected _onSourceEnd() {
    this.close();
  }

  protected _onSourceError(err: Error) {
    this.emit('error', err);
  }

  protected _end(destroy: boolean = false) {
    super._end(destroy);
    if (this._source) {
      this._source.removeListener('end', this._onSourceEnd);
      this._source.removeListener('error', this._onSourceError);
      this._source.removeListener('readable', this._onSourceReadable);
      delete this._source;
    }
  }

  read(): T | null {
    if (this._source)
      return this._source.read();
    return null;
  }
}

export interface WrapOptions {
  prioritizeIterable?: boolean;
  letIteratorThrough?: boolean;
}

export type WrapSource<T> = AsyncIterator<T> | T[] | EventEmitter | Iterator<T> | Iterable<T>;

function fromSource<T>(source: WrapSource<T> | undefined | null, options: WrapOptions = {}): AsyncIterator<T> {
  if (!source)
    return empty();
  if (options.letIteratorThrough && source instanceof AsyncIterator)
    return source;
  if (options.prioritizeIterable && isIterableOrIterator<T>(source))
    return fromIterableOrIterator<T>(source);
  if (Array.isArray(source))
    return fromArray<T>(source);
  if (isAsyncIteratorLike<T>(source))
    return fromAsyncIteratorLike<T>(source);
  if (!options.prioritizeIterable && isIterableOrIterator<T>(source))
    return fromIterableOrIterator<T>(source);
  throw new Error(`Unsupported source ${source}`);
}

export function wrap<T>(
  sourceOrPromise: WrapSource<T> | Promise<WrapSource<T>> | null | undefined,
  options: TransformIteratorOptions<T> & WrapOptions = {},
): AsyncIterator<T> {
  if ('maxBufferSize' in options || 'autoStart' in options || 'optional' in options || 'destroySource' in options)
    return new TransformIterator<T>(sourceOrPromise as AsyncIterator<T> | Promise<AsyncIterator<T>>, options);
  if (isPromise<T>(sourceOrPromise))
    return new WrappingIterator(sourceOrPromise, options);
  return fromSource(sourceOrPromise as WrapSource<T>, options);
}

/**
 Creates an iterator for the given ES2015 Iterable.
 @param {Iterable} iterable the iterable
 */
 export function fromIterable<T>(iterable: Iterable<T>): AsyncIterator<T> {
  return new IteratorIterator<T>(iterable[Symbol.iterator]());
}

/**
 Creates an iterator for the given ES2015 Iterator.
 @param {Iterable} iterator the iterator
 */
export function fromIterator<T>(iterator: Iterator<T>): AsyncIterator<T> {
  return new IteratorIterator<T>(iterator);
}

export function fromIterableOrIterator<T>(source: Iterable<T> | Iterator<T>): AsyncIterator<T> {
  if (isIterable(source))
    return fromIterable<T>(source);
  if (isIterator(source))
    return fromIterator<T>(source);
  throw new Error('Source is neither an Iterable or an Iterator');
}

/**
 * Creates an iterator for the given iterator-like object
 * (AsyncIterator, stream.Readable, ...).
 * @param {AsyncIteratorLike} iterator
 */
export function fromAsyncIteratorLike<T>(iterator: AsyncIteratorLike<T>): AsyncIterator<T> {
  return new WrappingIterator(iterator);
}


type AsyncIteratorLike<T> = EventEmitter & {
  on: (event: string | symbol, listener: (...args: any[]) => void) => AsyncIteratorLike<T>;
  read: () => T | null;
};

// Determines whether the given object is a function
function isFunction(object: any): object is Function {
  return typeof object === 'function';
}

// Determines whether the given object is an EventEmitter
function isEventEmitter(object: any): object is EventEmitter {
  return object && typeof object.on === 'function';
}


// Determines whether the given object is a source expression
function isSourceExpression<T>(object: any): object is SourceExpression<T> {
  return object && (isEventEmitter(object) || isPromise(object) || isFunction(object));
}

// Determines whether the given object implements basic streaming
// interfaces common to both stream.Readable and AsyncIterator
/* eslint-disable arrow-body-style */
function isAsyncIteratorLike<T>(item: { [key: string]: any }): item is AsyncIteratorLike<T> {
  return isFunction(item.on) && isFunction(item.read);
}

// Determines whether the given object is an instance of ES Iterator
function isIterator<T>(item: { [key: string]: any }): item is Iterator<T> {
  return isFunction(item.next);
}

// Determines whether the given object is an instance of ES Iterable
function isIterable<T>(item: { [key: string]: any }): item is Iterable<T> {
  return Symbol.iterator in item;
}

// Determines whether the given object is an instance of ES Iterable or an instance of ES Iterator
function isIterableOrIterator<T>(item: { [key: string]: any }): item is Iterable<T> | Iterator<T> {
  return isIterable<T>(item) || isIterator<T>(item);
}

/**
 * The IteratorIterator class provides a performant wrapper
 * to convert ES Iterable instances into AsyncIterator instances.
 */
 export class IteratorIterator<T> extends AsyncIterator<T> {
  private _source: Iterator<T>;

  /**
   *
   * @param source
   */
  constructor(source: Iterator<T>) {
    super();
    this._source = source;
    this.readable = true;
  }

  read(): T | null {
    if (!this._source)
      return null;
    const item = this._source.next();
    if (item.done) {
      this.close();
      return null;
    }
    return item.value;
  }

  protected _end(destroy: boolean = false) {
    super._end(destroy);
    // @ts-ignore
    delete this._source;
  }
}



/**
 * @param source An AsyncIterator
 * @returns The AsyncIterator if it is not empty, otherwise undefined
 */
export async function maybeIterator<T>(source: AsyncIterator<T>): Promise<null | AsyncIterator<T>> {
  // Avoid creating a new iterator where possible
  // if ((source instanceof ArrayIterator || source instanceof BufferedIterator) && (source as any)._buffer.length > 0) {
  //    return source
  // }
  // if (source instanceof IntegerIterator && (source as any).step >= 0 ? (source as any).next > (source as any).last : (source as any).next < (source as any).last) {
  //    return source;
  // }

  let item;
  do {
    if ((item = source.read()) !== null)
      return source.append([item]);
    await awaitReadable(source);
  } while (!source.done);
  return null;
}

function awaitReadable<T>(source: AsyncIterator<T>): Promise<void> {
  return new Promise<void>((res, rej) => {
    if (source.readable || source.done)
      res();

    function done() {
      cleanup();
      res();
    }

    function err() {
      cleanup();
      rej();
    }

    function cleanup() {
      source.removeListener('readable', done);
      source.removeListener('end', done);
      source.removeListener('error', err);
    }

    source.on('readable', done);
    source.on('end', done);
    source.on('error', err);
  });
}
