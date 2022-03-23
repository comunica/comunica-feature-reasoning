import { ActionContext } from '@comunica/core';
import { Store } from 'n3';
import type { IReasonGroup } from '../lib/ActorRdfReason';
import { getContextWithImplicitDataset, KeysRdfReason } from '../lib/ActorRdfReason';

describe('getContextWithImplicitDataset', () => {
  let store: Store;
  let factory: () => Store;
  let data: IReasonGroup;

  beforeEach(() => {
    data = {
      dataset: store,
      status: { type: 'full', reasoned: false },
      context: new ActionContext(),
    };
    factory = () => new Store();
  });

  it('Should throw an error if there is no data object or source generator', () => {
    expect(() => getContextWithImplicitDataset(new ActionContext())).toThrowError();
  });

  it('Should keep the original data key object if one is present', () => {
    let context = new ActionContext({ [KeysRdfReason.data.name]: data });
    let newContext = getContextWithImplicitDataset(context);

    expect(context).toEqual(newContext);
    expect(newContext.get<IReasonGroup>(KeysRdfReason.data)?.dataset === store).toEqual(true);

    context = new ActionContext({ [KeysRdfReason.data.name]: data, [KeysRdfReason.implicitDatasetFactory.name]: factory });
    newContext = getContextWithImplicitDataset(context);

    expect(context).toEqual(newContext);
    expect(newContext.get<IReasonGroup>(KeysRdfReason.data)?.dataset === store).toEqual(true);
  });

  it('Should generate a data object if none are present', () => {
    const context = new ActionContext({ [KeysRdfReason.implicitDatasetFactory.name]: factory });
    expect(getContextWithImplicitDataset(context).get(KeysRdfReason.data)).toBeDefined();
    expect(getContextWithImplicitDataset(context).get<IReasonGroup>(KeysRdfReason.data)?.dataset).toBeInstanceOf(Store);
  });
});
