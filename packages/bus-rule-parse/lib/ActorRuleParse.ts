import { Actor, IAction, IActorArgs, IActorOutput, IActorTest } from '@comunica/core';
import EventEmitter = require('events');
import type * as RDF from 'rdf-js';
import { Readable } from 'stream';

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
  rules: Stream<Rule> & Readable
}

function rule(...args: ConstructorParameters<typeof Rule>) {
  return new Rule(...args);
}

export class Rule {
  public constructor(premise: RDF.Quad[], conclusion: RDF.Quad[] | false) {
    this.premise = premise;
    this.conclusion = conclusion;
  };
  /**
   * Antecedents for the rule
   */
  premise: RDF.Quad[];
  /**
   * Consequent(s) for the rule
   */
  conclusion: RDF.Quad[] | false;

  public equals(other: Rule): boolean {
    if (this.conclusion === false) {
      return other.conclusion === false && quadEq(this.premise, other.premise)
    } else {
      return other.conclusion !== false && quadEq(this.premise, other.premise) && quadEq(this.conclusion, other.conclusion)
    }
  }
}

function quadEq(a: RDF.Quad[], b: RDF.Quad[]): boolean {
  return a.length === b.length && a.every((quad, index) => quad.equals(b[index]));
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
