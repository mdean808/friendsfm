import { Dialog } from '@capacitor/dialog';
import { Preferences } from '@capacitor/preferences';
import { action, atom } from 'nanostores';
import { user } from '.';
import { showToast } from '../lib/util';
import AppleMusic from '../plugins/AppleMusic';
import { MusicPlatform, type SavedSong } from '../types';
import { appCheckToken, authToken } from './auth';
import { loading, network } from './misc';

export const songs = atom<SavedSong[]>([]);

export const loadSongs = action(songs, 'load-songs', async (store) => {
  const message = await network.get().queryFirebase('getsongs');
  if (message) store.set(message as SavedSong[]);
});

export const toggleSong = action(
  songs,
  'add-song',
  async (store, song: SavedSong) => {
    let s = store.get();
    if (s.find((s) => s.name === song.name)) {
      // make sure the ID is present
      if (!song.id) song.id = s.find((so) => so.name === song.name)?.id;
      // remove the song from the list
      s = s.filter((s) => s.name !== song.name);
      store.set(s);
      // save to backend
      const message = await network.get().queryFirebase('deletesong', { song });
      if (!message) return;
    } else {
      const message = await network.get().queryFirebase('savesong', { song });
      if (!message) return;
      s.push(message as SavedSong);
      store.set(s);
      await Preferences.set({
        key: 'songs',
        value: JSON.stringify(s || []),
      });
    }
  }
);

export const createSongsPlaylist = action(
  songs,
  'create-songs-playlist',
  async () => {
    const u = user.get();
    if (u.likedSongsPlaylist) {
      if (u.musicPlatform === MusicPlatform.spotify)
        window.location.href =
          'https://open.spotify.com/playlist/' + u.likedSongsPlaylist;
      if (u.musicPlatform === MusicPlatform.appleMusic)
        window.location.href = u.likedSongsPlaylist;
      return;
    }
    if (u.musicPlatform === MusicPlatform.spotify) {
      const { value } = await Dialog.confirm({
        title: 'Create Spotify® Playlist',
        message:
          'This will create a new Spotify® playlist of your saved songs. Proceed?',
      });
      if (!value) return;
      loading.set(true);
      const message = await network
        .get()
        .queryFirebase('createlikedsongsplaylist');
      loading.set(false);
      if (!message) {
        //api response failed
        showToast({ content: 'Playlist creation failed. Please try again.' });
        return;
      }
      // goto the playlist!
      window.location.href = 'https://open.spotify.com/playlist/' + message;
      showToast({ content: 'playlist successfully created!' });
      return message;
    } else if (u.musicPlatform === MusicPlatform.appleMusic) {
      const { value } = await Dialog.confirm({
        title: 'Create Apple Music Playlist',
        message:
          'This will create a new Apple Music playlist of your saved songs. Proceed?',
      });
      if (!value) return;
      loading.set(true);
      const { url } = await AppleMusic.createPlaylist({
        name: 'friendsfm - saved songs',
      });
      const message = await network
        .get()
        .queryFirebase('setsongsplaylist', { playlist: url });
      loading.set(false);
      if (!message) {
        //api response failed
        showToast({ content: 'Playlist creation failed. Please try again.' });
        return;
      }
      // goto playlist
      window.location.href = url;
      showToast({ content: 'Playlist successfully created!' });
      return url;
    }
  }
);
