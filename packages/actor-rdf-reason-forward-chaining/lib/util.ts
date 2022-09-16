import type { AsyncIterator } from 'asynciterator';

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
    if ((item = source.read()) !== null) {
      return source.append([ item ]);
    }
    await awaitReadable(source);
  } while (!source.done);
  return null;
}

function awaitReadable<T>(source: AsyncIterator<T>): Promise<void> {
  return new Promise<void>((res, rej) => {
    if (source.readable || source.done) {
      res();
    }

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
