import { SavedSong, Song } from '../types';
import { SpotifyServerApi } from '@/classes/SpotifyServerApi';

export const getSpotifySong = async (song: Song | SavedSong) => {
  const spotifyApi = new SpotifyServerApi(
    process.env.SPOTIFY_CLIENT_ID,
    process.env.SPOTIFY_CLIENT_SECRET
  );

  const res = await spotifyApi.getSong(song.name, song.artist);

  return res.tracks?.items[0];
};
