import type { AudialAttempt, AudialSong } from '$lib/types/audial';
import { FirebaseFirestore } from '@capacitor-firebase/firestore';
import type { SpotifyTrack, Submission } from './types/friendsfm';
import { writable } from 'svelte/store';

const BASE_URL = 'https://us-central1-audial-6e1bd.cloudfunctions.net';

export const audialTracks = writable<SpotifyTrack[]>([]);
export const audialAnswer = writable<SpotifyTrack>();
export const audialAttempt = writable<AudialAttempt>({
  guesses: [],
  date: new Date(),
  correct: false,
  attempts: 0,
  type: 'default',
});
export const audialSongPaused = writable<boolean>(true);

// save the score to the submission
export const setSubmissionAudial = async (
  submission: Submission,
  attempt: AudialAttempt
): Promise<Submission> => {
  await FirebaseFirestore.updateDocument({
    reference: `submissions/${submission.id}`,
    data: {
      audial: attempt,
    },
  });
  return { ...submission, audial: attempt };
};

export const getCurrentAudial = async (
  random?: boolean,
  playlistId?: string
) => {
  const res = await fetch(
    `${BASE_URL}/daily?playlist=${playlistId || ''}&random=${random || false}&locale=${new Date().toDateString()}`,
    {
      method: 'GET',
      cache: 'reload',
    }
  );
  const json = await res.json();
  json.answer = json.daily;
  delete json.daily;
  return json as { answer: SpotifyTrack; tracks: SpotifyTrack[] };
};

export const spotifyTrackToAudialSong = (track: SpotifyTrack) => {
  const song: AudialSong = {
    name: track.name,
    artist: track.artists ? track.artists[0].name : 'unknown artist',
    id: track.id,
    preview: track.preview_url,
  };
  return song;
};
