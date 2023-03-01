import { atom } from 'nanostores';

export const currPath = atom<string>('/');

export const prevPath = atom<string>('');

export const loading = atom<boolean>(false);

//TODO: request friend submissions, user data every 30(?) seconds
