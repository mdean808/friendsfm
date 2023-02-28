import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Preferences } from '@capacitor/preferences';
import { atom, action } from 'nanostores';
import { friendSubmissions, updateUser, user, userSubmission } from '.';
import { handleApiResponse, registerForNotifications } from '../lib';
import type { User } from '../types';

export const spotifyAuthCode = atom<string>('');

export const authToken = atom<string>('');
export const getNewAuthToken = action(
  authToken,
  'new-authtoken',
  async (store) => {
    try {
      const res = await FirebaseAuthentication.getIdToken();
      store.set(res.token);
      return res.token;
    } catch (e) {
      // user isn't logged in anymore
      console.log('Error grabbing new authToken. User must sign in.');
      return '';
    }
  }
);

export const loginUser = action(user, 'login-user', async (store) => {
  const u = store.get();
  u.messagingToken = await registerForNotifications().catch();
  const res = await fetch(
    'https://us-central1-friendsfm.cloudfunctions.net/loginUser',
    {
      method: 'POST',
      body: JSON.stringify(u),
    }
  );

  const json = await handleApiResponse(res);
  if (!json) {
    // handle login failure
    return false;
  }

  store.set(json.message as User);
  await updateUser(json.message);
  return true;
});
// Log thet user out
export const logout = action(user, 'logout', async (store) => {
  FirebaseAuthentication.signOut();
  store.set(null);
  userSubmission.set(null);
  friendSubmissions.set(null);
  authToken.set(null);
  await Preferences.remove({ key: 'user' });
});
