import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { network } from './util';
import { session } from './session';

export const sendFriendRequest = async (username: string) => {
  username = username.toLowerCase();
  const message = await network.queryFirebase('requestfriend', {
    friend: username,
  });
  FirebaseAnalytics.logEvent({ name: 'send_friend_request' });
  return message;
};

export const acceptFriendRequest = async (requester: string) => {
  const message = await network.queryFirebase('acceptfriend', { requester });
  FirebaseAnalytics.logEvent({ name: 'accept_friend_request' });
  return message;
};

export const rejectFriendRequest = async (requester: string) => {
  const message = await network.queryFirebase('rejectrequest', { requester });
  session.update((s) => {
    s.user.friendRequests = s.user.friendRequests.filter(
      (fr) => fr !== requester
    );
    return s;
  });
  FirebaseAnalytics.logEvent({ name: 'reject_friend_request' });
  return message;
};

export const getFriendSuggestions = async () => {
  const message = await network.queryFirebase('getfriendsuggestions');
  if (!message) return false;
  return message as { username: string; mutual?: string }[];
};
