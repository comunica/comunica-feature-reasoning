import { ActionContextKey } from '@comunica/core';
import type { IDatasetFactory, IReasonGroup, IProofDestination } from '@comunica/reasoning-types';

export const KeysRdfReason = {
  /**
   * The data to reason over in the *current context*.
   */
  data: new ActionContextKey<IReasonGroup>('@comunica/bus-rdf-reason:data'),
  /**
   * The rules to use for reasoning in the *current context*
   */
  rules: new ActionContextKey<string>('@comunica/bus-rdf-reason:rules'),
  /**
   * A factory to generate new implicit datasets
   */
  implicitDatasetFactory: new ActionContextKey<IDatasetFactory>('@comunica/bus-rdf-reason:implicitDatasetFactory'),
  /**
   * A destination for proofs
   */
  proofDestination: new ActionContextKey<IProofDestination>('@comunica/bus-rdf-reason:proofDestination')
};

export const KeysRdfDereferenceConstantHylar = {
  rdfs: '@comunica/bus-rdf-dereference:constant-hylar-rdfs',
  owl2rl: '@comunica/bus-rdf-dereference:constant-hylar-owl2rl',
};
