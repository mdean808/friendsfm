import { Preferences } from '@capacitor/preferences';
import type { SavedSong, Submission, User } from '$lib/types/friendsfm';

export const getUser = async () => {
  const userRes = await Preferences.get({ key: 'user' });
  if (!userRes.value) return {} as User;
  return JSON.parse(userRes.value) as User;
};
export const setUser = async (user?: User) => {
  if (!user) await Preferences.remove({ key: 'user' });
  else await Preferences.set({ key: 'user', value: JSON.stringify(user) });
};

export const getLogin = async () => {
  const res = await Preferences.get({ key: 'logged-in' });
  return res?.value === '1';
};
export const setLogin = async (loggedIn: boolean = false) => {
  await Preferences.set({ key: 'logged-in', value: loggedIn ? '1' : '0' });
};

export const getSongs = async () => {
  const res = await Preferences.get({ key: 'songs' });
  if (!res.value) return [];
  return JSON.parse(res.value) as SavedSong[];
};
export const setSongs = async (songs?: SavedSong[]) => {
  if (!songs) await Preferences.remove({ key: 'songs' });
  else await Preferences.set({ key: 'songs', value: JSON.stringify(songs) });
};

export const getFriendSubmissions = async () => {
  const res = await Preferences.get({ key: 'friend-submissions' });
  if (!res.value) return [];
  return JSON.parse(res.value) as Submission[];
};

export const setFriendSubmissions = async (
  friendSubmissions?: Submission[]
) => {
  if (!friendSubmissions)
    await Preferences.remove({ key: 'friend-submissions' });
  else
    await Preferences.set({
      key: 'friend-submissions',
      value: JSON.stringify(friendSubmissions),
    });
};


export default {
  getUser,
  setUser,
  getLogin,
  setLogin,
  getSongs,
  setSongs,
  getFriendSubmissions,
  setFriendSubmissions
};
