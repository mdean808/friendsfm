import { get, writable, type Writable } from 'svelte/store';
import { MusicPlatform, type SavedSong, type Song } from '$lib/types';
import { session } from '$lib/session';
import { Dialog } from '@capacitor/dialog';
import { loading, network, showToast } from '$lib/util';
import AppleMusic from '$plugins/AppleMusic';

export const songs = <Writable<Song[]>>writable();

export const createSongsPlaylist = async () => {
  const u = get(session).user;
  if (u.likedSongsPlaylist) {
    if (u.public.musicPlatform === MusicPlatform.spotify)
      window.location.href =
        'https://open.spotify.com/playlist/' + u.likedSongsPlaylist;
    if (u.public.musicPlatform === MusicPlatform.appleMusic)
      window.location.href = u.likedSongsPlaylist;
    return;
  }
  if (u.public.musicPlatform === MusicPlatform.spotify) {
    const { value } = await Dialog.confirm({
      title: 'Create Spotify® Playlist',
      message:
        'This will create a new Spotify® playlist of your saved songs. Proceed?',
    });
    if (!value) return;
    loading.set(true);
    const message = await network.queryFirebase('createlikedsongsplaylist');
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
  } else if (u.public.musicPlatform === MusicPlatform.appleMusic) {
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
    const message = await network.queryFirebase('setsongsplaylist', {
      playlist: url,
    });
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
};

export const toggleSavedSong = async (savedSong?: SavedSong) => {
  if (!savedSong) return;
  session.update((sesh) => {
    // song exists in saved songs
    if (sesh.songs.find((song) => song.name === savedSong.name)) {
      // make sure the ID is present
      if (!savedSong.id)
        savedSong.id =
          sesh.songs.find((song) => song.name === savedSong.name)?.id ||
          'unknown';
      // remove the song from the list
      sesh.songs = sesh.songs.filter((s) => s.name !== savedSong.name);
      // save to backend
    } else {
      sesh.songs.push(savedSong);
    }
    return sesh;
  });
  if (get(session).songs.find((song) => song.name === savedSong.name)) {
    const message = await network.queryFirebase('deletesong', {
      song: savedSong,
    });
    if (!message) return;
  } else {
    const message = await network.queryFirebase('savesong', {
      song: savedSong,
    });
    if (!message) return;
  }
};
