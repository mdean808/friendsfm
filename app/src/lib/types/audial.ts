export interface AudialSong {
  name: string;
  artist: string;
  id: string;
  preview?: string;
}

export interface AudialGuess {
  song: AudialSong;
  correct: boolean;
  artistCorrect: boolean;
}

export interface AudialAttempt {
  guesses: AudialGuess[];
  date: Date;
  correct: boolean;
  attempts: number;
  type?: string;
}

