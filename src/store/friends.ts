import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { action } from 'nanostores';
import { authToken, updateUser, user } from '.';
import { handleApiResponse } from '../lib';
import type { User } from '../types';

export const sendFriendRequest = action(
  user,
  'send-friend-request',
  async (_store, friend) => {
    const res = await fetch(
      'https://us-central1-friendsfm.cloudfunctions.net/requestFriend',
      {
        method: 'POST',
        body: JSON.stringify({
          authToken: authToken.get(),
          friend,
        }),
      }
    );
    const json = await handleApiResponse(res);
    if (!json) {
      // failed to send request
      return false;
    }
    FirebaseAnalytics.logEvent({ name: 'send-friend-request' });
    return true;
  }
);

export const acceptFriendRequest = action(
  user,
  'accpet-friend-request',
  async (store, requester) => {
    const res = await fetch(
      'https://us-central1-friendsfm.cloudfunctions.net/acceptFriend',
      {
        method: 'POST',
        body: JSON.stringify({
          authToken: authToken.get(),
          requester,
        }),
      }
    );
    const json = await handleApiResponse(res);
    if (!json) {
      // failed to send request
      return false;
    }
    store.set(json.message as User);
    updateUser(json.message);
    FirebaseAnalytics.logEvent({ name: 'accpet-friend-request' });
    return true;
  }
);

export const rejectFriendRequest = action(
  user,
  'accpet-friend-request',
  async (store, requester) => {
    const res = await fetch(
      'https://us-central1-friendsfm.cloudfunctions.net/rejectRequest',
      {
        method: 'POST',
        body: JSON.stringify({
          authToken: authToken.get(),
          requester,
        }),
      }
    );
    const json = await handleApiResponse(res);
    if (!json) {
      // failed to send request
      return false;
    }
    store.set(json.message as User);
    updateUser(json.message);
    FirebaseAnalytics.logEvent({ name: 'reject-friend-request' });
    return true;
  }
);
