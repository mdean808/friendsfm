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

export const saveSong = async (song: SavedSong) => {
  session.update((sesh) => {
    // song exists in saved songs - return
    if (sesh.songs.find((song) => song.name === song.name)) return sesh
    // add the song 
    sesh.songs.push(song);
    return sesh
  });
  // save to backend
  await network.queryFirebase('savesong', {
    song: song,
  });
}

export const unsaveSong = async (song: SavedSong) => {
  session.update((sesh) => {
    // song doesn't exist in saved songs - return
    if (!sesh.songs.find((song) => song.name === song.name)) return sesh
    // remove the song 
    // make sure the ID is present
    if (!song.id)
      song.id =
        sesh.songs.find((song) => song.name === song.name)?.id ||
        'unknown';
    // remove the song from the list
    sesh.songs = sesh.songs.filter((s) => s.name !== song.name);
    return sesh
  });
  // save to backend
  await network.queryFirebase('deletesong', {
    song: song,
  });
}

  export const toggleSong = async (savedSong?: SavedSong) => {
    if (!savedSong) return;
    if ($session.songs.find((song) => song.name === savedSong.name)) {
      // song exists
      await unsaveSong(savedSong);
    } else {
      // song doesn't exist
      await saveSong(savedSong);
    }
  };
