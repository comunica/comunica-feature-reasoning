import { AsyncIterator, ArrayIterator, BufferedIterator, IntegerIterator, scheduleTask, fromArray, wrap } from 'asynciterator';
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

  constructor(sourceOrPromise: Promise<AsyncIterator<T>>, options: WrapOptions = {}) {
    return wrap(sourceOrPromise as any) as any
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


/**
 * @param source An AsyncIterator
 * @returns The AsyncIterator if it is not empty, otherwise undefined
 */
export async function maybeIterator<T>(source: AsyncIterator<T>): Promise<null | AsyncIterator<T>> {
  const arr = await source.toArray();

  return arr.length === 0 ? null : fromArray(arr);
  
  
  // Avoid creating a new iterator where possible
  // if ((source instanceof ArrayIterator || source instanceof BufferedIterator) && (source as any)._buffer.length > 0) {
  //    return source
  // }
  // if (source instanceof IntegerIterator && (source as any).step >= 0 ? (source as any).next > (source as any).last : (source as any).next < (source as any).last) {
  //    return source;
  // }

  // console.log('a')

  // const l = await source.take(1).toArray();
  // console.log('b')

  // if (l.length === 1) {
  //   console.log('c')
  //   return source.append(l)
  // }

  // console.log('d')

  // return null;

  console.log('starting maybe iterator')

  let item;
  do {
    if ((item = source.read()) !== null) {
      console.log('returning maybeIterator with 1 elem')
      return source.append([item]);
    }
    await awaitReadable(source);
  } while (!source.done);

  console.log('returning null from maybeiterator')
  return null;
}

function awaitReadable<T>(source: AsyncIterator<T>): Promise<void> {
  console.log('inside awaitReadable', source.done, source.readable, source.ended, source.closed, source.destroyed,)
  return new Promise<void>((res, rej) => {
    if (source.readable || source.done) {
      console.log('await readable quick finish')
      res();
    }

    function done() {
      console.log('done with awaitRedable')
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

    if (source.readable || source.done) {
      console.log('quick done')
      done();
    }
  });
}
