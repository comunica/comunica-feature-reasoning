import { Actor, IAction, IActorArgs, IActorOutput, IActorTest } from '@comunica/core';
import EventEmitter = require('events');
import type * as RDF from 'rdf-js';

/**
 * A comunica actor for parsing reasoning rules
 *
 * Actor types:
 * * Input:  IActionRuleParse:      TODO: fill in.
 * * Test:   <none>
 * * Output: IActorRuleParseOutput: TODO: fill in.
 *
 * @see IActionRuleParse
 * @see IActorRuleParseOutput
 */
export abstract class ActorRuleParse extends Actor<IActionRuleParse, IActorTest, IActorRuleParseOutput> {
  public constructor(args: IActorArgs<IActionRuleParse, IActorTest, IActorRuleParseOutput>) {
    super(args);
  }
}

export interface IActionRuleParse extends IAction {
    /**
     * A readable string stream in a certain rule serialization that needs to be parsed.
     */
     input: NodeJS.ReadableStream;
}

export interface IActorRuleParseOutput extends IActorOutput {
    /**
     * The resulting rule stream.
     */
    rules: Stream<Rule>
}

export interface Rule {
    /**
     * Antecedents for the rule
     */
    antecedents: RDF.Quad[];
    /**
     * Consequent(s) for the rule
     */
    consequences: RDF.Quad[];
}

/**
 * A rule stream.
 * This stream is only readable, not writable.
 *
 * Events:
 * * `readable()`:           When a rule can be read from the stream, it will emit this event.
 * * `end()`:                This event fires when there will be no more rules to read.
 * * `error(error: Error)`:  This event fires if any error occurs. The `message` describes the error.
 * * `data(rule: Rule)`: This event is emitted for every rule that can be read from the stream.
 *                           The rule is the content of the data.
 * Optional events:
 * * prefix(prefix: string, iri: RDF.NamedNode): This event is emitted every time a prefix is mapped to some IRI.
 */
 export interface Stream<T> extends EventEmitter {
  /**
   * This method pulls a rule out of the internal buffer and returns it.
   * If there is no quad available, then it will return null.
   *
   * @return A rule from the internal buffer, or null if none is available.
   */
  read(): T | null;
}
