import { ActorRuleParse, IActionRuleParse, IActorRuleParseOutput, Rule } from '@comunica/bus-rule-parse';
import { IActorArgs, IActorTest } from '@comunica/core';
import { ArrayIterator, wrap } from 'asynciterator';
import type { ParserOptions } from 'n3';
import { Parser } from 'n3';
import { platform } from 'os';

// TODO: Properly look into ontology https://www.w3.org/2000/10/swap/log#
// For now only handles basic things of forms like { ?x fam:brother ?y; fam:son ?z } => { ?x fam:nephew ?z }.
// Test suite https://github.com/w3c/N3/blob/16d1eec49048f87a97054540f4e1301e73a12130/tests/N3Tests/cwm_syntax/this-quantifiers-ref2.n3

/**
 * Naive function that takes string of the form { ?x fam:brother ?y; fam:son ?z } => { ?x fam:nephew ?z }. and returns a rule.
 * Context may optionally be supplied
 */
function N3StringToRule(rule: string, context: ParserOptions): Rule {
  // TODO: Update - this is very naive and will break, for instance if "} => {"
  // is contained inside an object string
  rule.replace(//).split('} => {')
}

// TODO: Extract into separate package when extended to full n3 syntax
class N3RuleTransform {
  private counter = 1
  private escaped = false;
  private parser = new Parser({ format: 'N3' });
  transform(item: string, done: () => void, push: (rule: Rule) => void) {
    // TODO: Implement this with stream parser - possibly use graphy
    const antecedents: Rule[] = [];
    const consequents: Rule[] = [];
    
    
    // this.parser.on('data')
  }
}

/**
 * A comunica N3 Rule Parse Actor.
 */
export class ActorRuleParseN3 extends ActorRuleParse {
  public constructor(args: IActorArgs<IActionRuleParse, IActorTest, IActorRuleParseOutput>) {
    super(args);
  }

  public async test(action: IActionRuleParse): Promise<IActorTest> {
    return true; // TODO implement
  }

  public async run(action: IActionRuleParse): Promise<IActorRuleParseOutput> {
    // TODO: Double check typing here
    const iterator = wrap<string>(action.input);
    return {
      rules: iterator.transform({ transform: new N3RuleTransform().transform }),
    };
  }
}
