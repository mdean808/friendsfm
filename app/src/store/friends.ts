import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { action } from 'nanostores';
import { appCheckToken, authToken, refreshUser, user } from '.';
import { getFirebaseUrl, handleApiResponse } from '../lib/network';

export const sendFriendRequest = action(
  user,
  'send-friend-request',
  async (_store, friend: string) => {
    friend = friend.toLowerCase();
    const res = await fetch(getFirebaseUrl('requestfriend'), {
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
  async (_store, requester) => {
    const res = await fetch(getFirebaseUrl('acceptfriend'), {
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
    refreshUser();
    FirebaseAnalytics.logEvent({ name: 'accept_friend_request' });
    return true;
  }
);

export const rejectFriendRequest = action(
  user,
  'accpet-friend-request',
  async (store, requester) => {
    const res = await fetch(getFirebaseUrl('rejectrequest'), {
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
    const u = store.get();
    u.friendRequests = u.friendRequests.filter((fr) => fr !== requester);
    store.set(u);
    FirebaseAnalytics.logEvent({ name: 'reject_friend_request' });
    return true;
  }
);

export const getFriendSuggestions = action(
  user,
  'get-friend-suggestions',
  async () => {
    const res = await fetch(getFirebaseUrl('getfriendsuggestions'), {
      method: 'POST',
      body: JSON.stringify({ authToken: authToken.get() }),
      headers: { 'X-Firebase-AppCheck': appCheckToken.get() },
    });
    const json = await handleApiResponse(res);
    if (!json) {
      // failed to send request
      return false;
    }
    return json.message as { username: string; mutual?: string }[];
  }
);
