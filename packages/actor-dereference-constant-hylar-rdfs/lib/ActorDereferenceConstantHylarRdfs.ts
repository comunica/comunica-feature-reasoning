import type { IActionDereference, IActorDereferenceOutput, IActorDereferenceArgs } from '@comunica/bus-dereference';
import { ActorDereference } from '@comunica/bus-dereference';
import type { IActorTest } from '@comunica/core';
import { KeysRdfDereferenceConstantHylar } from '@comunica/reasoning-context-entries';

const Streamify = require('streamify-string');

/**
 * A comunica Constant Hylar RDFs Dereference Actor.
 */
export class ActorDereferenceConstantHylarRdfs extends ActorDereference {
  public constructor(args: IActorDereferenceArgs) {
    super(args);
  }

  public async test(action: IActionDereference): Promise<IActorTest> {
    if (action.url === KeysRdfDereferenceConstantHylar.rdfs) {
      return true;
    }
    throw new Error(`This actor requires the url to be set to the constant ${KeysRdfDereferenceConstantHylar.rdfs}`);
  }

  public async run(action: IActionDereference): Promise<IActorDereferenceOutput> {
    return {
      data: Streamify(data),
      url: 'rdfs.hylar',
      requestTime: 0,
      exists: true,
    };
  }
}

const data = `
(?uuu ?aaa ?yyy) -> (?aaa rdf:type rdf:Property)
(?aaa rdfs:domain ?xxx) ^ (?uuu ?aaa ?yyy) -> (?uuu rdf:type ?xxx)
(?aaa rdfs:range ?xxx) ^ (?uuu ?aaa ?vvv) -> (?vvv rdf:type ?xxx)
(?uuu ?aaa ?xxx) -> (?uuu rdf:type rdfs:Resource)
(?uuu ?aaa ?vvv) -> (?vvv rdf:type rdfs:Resource)
(?uuu rdfs:subPropertyOf ?vvv) ^ (?vvv rdfs:subPropertyOf ?xxx) -> (?uuu rdfs:subPropertyOf ?xxx)
(?uuu rdf:type rdf:Property) -> (?uuu rdfs:subPropertyOf ?uuu)
(?aaa rdfs:subPropertyOf ?bbb) ^ (?uuu ?aaa ?yyy) -> (?uuu ?bbb ?yyy)
(?uuu rdf:type rdfs:Class) -> (?uuu rdfs:subClassOf rdfs:Resource)
(?uuu rdfs:subClassOf ?xxx) ^ (?vvv rdf:type ?uuu) -> (?vvv rdf:type ?xxx)
(?uuu rdf:type rdfs:Class) -> (?uuu rdfs:subClassOf ?uuu)
(?uuu rdfs:subClassOf ?vvv) ^ (?vvv rdfs:subClassOf ?xxx) -> (?uuu rdfs:subClassOf ?xxx)
(?uuu rdf:type rdfs:ContainerMembershipProperty) -> (?uuu rdfs:subPropertyOf rdfs:member)
(?uuu rdf:type rdfs:Datatype) -> (?uuu rdfs:subClassOf rdfs:Literal)
`;
