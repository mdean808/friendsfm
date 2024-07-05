import type { QueryCompositeFilterConstraint } from '@capacitor-firebase/firestore';
import { session } from './session';
import { get } from 'svelte/store';
import { currSubNumber } from './util';

export const userSubmissionFilter = () => {
  return {
    type: 'and',
    queryConstraints: [
      {
        type: 'where',
        fieldPath: 'userId',
        opStr: '==',
        value: get(session)?.user.id,
      },
      {
        type: 'where',
        fieldPath: 'number',
        opStr: '==',
        value: get(currSubNumber),
      },
    ],
  } as QueryCompositeFilterConstraint;
};

export const friendSubmissionsFilter = (chunk: string[]) => {
  return {
    type: 'and',
    queryConstraints: [
      {
        type: 'where',
        fieldPath: 'userId',
        opStr: 'in',
        value: chunk,
      },
      {
        type: 'where',
        fieldPath: 'number',
        opStr: '==',
        value: get(currSubNumber),
      },
    ],
  } as QueryCompositeFilterConstraint;
};
