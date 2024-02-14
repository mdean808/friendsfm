import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { action } from 'nanostores';
import { appCheckToken, authToken, network, refreshUser, user } from '.';

export const sendFriendRequest = action(
  user,
  'send-friend-request',
  async (_store, friend: string) => {
    friend = friend.toLowerCase();
    const message = await network
      .get()
      .queryFirebase('requestfriend', { friend });
    FirebaseAnalytics.logEvent({ name: 'send_friend_request' });
    return message;
  }
);

export const acceptFriendRequest = action(
  user,
  'accpet-friend-request',
  async (_store, requester) => {
    const message = await network
      .get()
      .queryFirebase('acceptfriend', { requester });
    refreshUser();
    FirebaseAnalytics.logEvent({ name: 'accept_friend_request' });
    return message;
  }
);

export const rejectFriendRequest = action(
  user,
  'accpet-friend-request',
  async (store, requester) => {
    const message = await network
      .get()
      .queryFirebase('rejectrequest', { requester });
    const u = store.get();
    u.friendRequests = u.friendRequests.filter((fr) => fr !== requester);
    store.set(u);
    FirebaseAnalytics.logEvent({ name: 'reject_friend_request' });
    return message;
  }
);

export const getFriendSuggestions = action(
  user,
  'get-friend-suggestions',
  async () => {
    const message = await network.get().queryFirebase('getfriendsuggestions');
    if (!message) return false;
    return message as { username: string; mutual?: string }[];
  }
);
