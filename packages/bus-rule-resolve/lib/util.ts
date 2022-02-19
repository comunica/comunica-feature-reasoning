// TODO [FUTURE]:
// Use pattern at
// https://github.com/comunica/comunica/blob/next/major/packages/bus-rdf-resolve-quad-pattern/lib/utils.ts
// to enable multiple rule sources
import { KeysRdfReason } from '@comunica/bus-rdf-reason';
import type { IActionContext } from '@comunica/types';

export function getContextSource(context: IActionContext): string | undefined {
  return context.get(KeysRdfReason.rules);
}

// TODO: Future - this will be needed
// /**
//  * Get the data source type.
//  * @param dataSource A data source.
//  */
// export function getDataSourceType() {
//   if (typeof dataSource === 'string') {
//     return '';
//   }
//   return 'match' in dataSource ? 'rdfjsSource' : dataSource.type;
// }
