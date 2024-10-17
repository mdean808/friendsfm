import type { AudialAttempt } from '$lib/types/audial';
import { FirebaseFirestore } from '@capacitor-firebase/firestore';
import type { SpotifyTrack, Submission } from './types/friendsfm';

const BASE_URL = 'https://us-central1-audial-6e1bd.cloudfunctions.net'

// save the score to the submission
export const setSubmissionAudial = async (submission: Submission, attempt: AudialAttempt): Promise<Submission> => {
  await FirebaseFirestore.updateDocument({
    reference: `submissions/${submission.id}`,
    data: {
      audial: attempt
    },
  });
  return { ...submission, audial: attempt }
}

export const getCurrentAudial = async (random?: boolean, playlistId?: string) => {
  const res = await fetch(
    `${BASE_URL}/daily?playlist=${playlistId || ''}&random=${random || false}&locale=${new Date().toDateString()}`,
    {
      method: 'GET',
      cache: 'reload'
    }
  );
  return (await res.json()) as { answer: SpotifyTrack; tracks: SpotifyTrack[] };
};
