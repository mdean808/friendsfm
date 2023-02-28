import { atom } from 'nanostores';

export const currPath = atom<string>('/');

export const prevPath = atom<string>('');

export const loading = atom<boolean>(false);
