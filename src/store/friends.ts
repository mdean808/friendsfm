import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { action } from 'nanostores';
import { appCheckToken, authToken, FIREBASE_URL, updateUser, user } from '.';
import { handleApiResponse } from '../lib';
import type { User } from '../types';

export const sendFriendRequest = action(
  user,
  'send-friend-request',
  async (_store, friend: string) => {
    friend = friend.toLowerCase();
    const res = await fetch(FIREBASE_URL.get() + '/requestFriend', {
      method: 'POST',
      body: JSON.stringify({
        authToken: authToken.get(),
        friend,
      }),
      headers: { 'X-Firebase-AppCheck': appCheckToken.get() },
    });
    const json = await handleApiResponse(res);
    if (!json) {
      // failed to send request
      return false;
    }
    FirebaseAnalytics.logEvent({ name: 'send_friend_request' });
    return true;
  }
);

export const acceptFriendRequest = action(
  user,
  'accpet-friend-request',
  async (store, requester) => {
    const res = await fetch(FIREBASE_URL.get() + '/acceptFriend', {
      method: 'POST',
      body: JSON.stringify({
        authToken: authToken.get(),
        requester,
      }),
      headers: { 'X-Firebase-AppCheck': appCheckToken.get() },
    });
    const json = await handleApiResponse(res);
    if (!json) {
      // failed to send request
      return false;
    }
    store.set(json.message as User);
    updateUser(json.message);
    FirebaseAnalytics.logEvent({ name: 'accept_friend_request' });
    return true;
  }
);

export const rejectFriendRequest = action(
  user,
  'accpet-friend-request',
  async (store, requester) => {
    const res = await fetch(FIREBASE_URL.get() + '/rejectRequest', {
      method: 'POST',
      body: JSON.stringify({
        authToken: authToken.get(),
        requester,
      }),
      headers: { 'X-Firebase-AppCheck': appCheckToken.get() },
    });
    const json = await handleApiResponse(res);
    if (!json) {
      // failed to send request
      return false;
    }
    store.set(json.message as User);
    updateUser(json.message);
    FirebaseAnalytics.logEvent({ name: 'reject_friend_request' });
    return true;
  }
);
