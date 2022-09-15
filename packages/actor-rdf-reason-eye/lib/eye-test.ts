import { EyeIterator } from './eye';

const SOCH = `
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix : <http://example.org/socrates#>.

:Socrates a :Human.
:Human rdfs:subClassOf :Mortal.

{?A rdfs:subClassOf ?B. ?S a ?A} => {?S a ?B}.
`

const SOCH_QUERY = `
@prefix : <http://example.org/socrates#>.

{:Socrates a ?WHAT} => {:Socrates a ?WHAT}.`

// NOTE: Enable this to run a quick test
const iterator = new EyeIterator(SOCH, SOCH_QUERY);
iterator.on('data', (d) => {
  console.log(d)
})
iterator.on('end', (d) => {
  console.log('----------------------------------------------------------------------------- end -----------------------')
})
