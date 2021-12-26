// TODO [IMPORTANT!]: This should end up in https://github.com/comunica/comunica/blob/dfb903079605ce898f7206b0125eb60e89f993c8/packages/context-entries/lib/Keys.ts when merging

import { Dataset } from '@rdfjs/types'

// TODO: See if this should be IDataSource & IDataDestination

export enum KeysRdfReason {
  /**
   * @range {Dataset}
   */
  dataset = '@comunica/bus-rdf-reason:dataset',
  /**
   * TODO: Check correct range
   * @range {IReasonerOptions}
   */
  reasonerOptions = '@comunica/bus-rdf-reason:reasonerOptions',
  /**
   * TODO: See if these rules should have more structure - or be passed down differently
   * @range {Rule[]}
   */
  rules = '@comunica/bus-rdf-reason:rules',
}


