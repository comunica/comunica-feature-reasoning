import { Bus } from '@comunica/core';
import mediators from './mediators';

export const actorParams = {
  ...mediators,
  name: 'actor',
  bus: new Bus({ name: 'bus' }),
};

export {
  mediators,
};

export * from './mediators';
