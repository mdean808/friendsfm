import { get, writable, type Writable } from 'svelte/store';
import { MusicPlatform, type Song } from '$lib/types';
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
