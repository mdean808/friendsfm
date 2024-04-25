import { writable, type Writable } from 'svelte/store';
import type { Song } from '$lib/types';

export const songs = <Writable<Song[]>>writable();
