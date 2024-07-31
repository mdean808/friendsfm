import { SavedSong, Song } from '../types';
import { SpotifyServerApi } from '@/classes/SpotifyServerApi';

export const getSpotifySong = async (song: Song | SavedSong) => {
  const spotifyApi = new SpotifyServerApi(
    process.env.SPOTIFY_CLIENT_ID,
    process.env.SPOTIFY_CLIENT_SECRET
  );
  console.log(song)

  const res = await spotifyApi.getSong(song.name, song.artist);
  console.log(res)

  return res.tracks?.items[0];
};
