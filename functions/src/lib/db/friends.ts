import { getFirestore } from 'firebase-admin/firestore';
import { Message } from 'firebase-admin/messaging';
import { User } from '../../types';
import { newNotification } from '../notifications';

const db = getFirestore();

export const acceptFriendRequest = async (
  user: User,
  requestUsername: string
) => {
  if (!requestUsername) throw new Error('No requester provided');
  const usersRef = db.collection('users');
  const friendQuery = usersRef.where('username', '==', requestUsername);
  const friend = (await friendQuery.get()).docs[0]?.data() as User;
  // if we have such a friend and there is an actual request from them to the user
  if (friend && user.friendRequests.find((u) => u === friend.username)) {
    // update user friends
    const userFriends = user.friends;
    userFriends.push({ username: friend.username, id: friend.uid });
    const userRef = usersRef.doc(user.id);
    await userRef.update({ friends: userFriends });
    // remove from friend request array
    const userFriendRequests = user.friendRequests;
    const updatedRequests = userFriendRequests.filter(
      (u) => u !== friend.username
    );
    await userRef.update({ friendRequests: updatedRequests });

    // update friend friends
    const friendFriends = friend.friends;
    friendFriends.push({ username: user.username, id: user.id });
    const friendRef = usersRef.doc(friend.uid);
    await friendRef.update({ friends: friendFriends });

    // send notification
    if (friend.messagingToken) {
      const message: Message = {
        notification: {
          title: user.username + ' accepted your friend request!',
          body: "tap to see what they're listening to",
        },
        token: friend.messagingToken,
      };
      newNotification(message);
    }
    return (await userRef.get()).data() as User;
  } else {
    throw new Error('Friend request does not exist.');
  }
};

export const rejectFriendRequest = async (
  user: User,
  requestUsername: string
) => {
  if (!requestUsername) throw new Error('No requester provided');
  const usersRef = db.collection('users');
  const friendQuery = usersRef.where('username', '==', requestUsername);
  const friend = (await friendQuery.get()).docs[0]?.data() as User;
  // if we have such a friend and there is an actual request from them to the user
  if (friend && user.friendRequests.find((u) => u === friend.username)) {
    // remove from friend request array
    const userRef = usersRef.doc(user.uid);
    const userFriendRequests = user.friendRequests;
    const updatedRequests = userFriendRequests.filter(
      (u) => u !== friend.username
    );
    await userRef.update({ friendRequests: updatedRequests });

    // update friend friends
    return (await userRef.get()).data() as User;
  } else {
    throw new Error('Friend request does not exist.');
  }
};
export const sendFriendRequest = async (user: User, friendUsername: string) => {
  if (!friendUsername) throw new Error('No username provided');

  const usersRef = db.collection('users');
  const friendQuery = usersRef.where('username', '==', friendUsername);
  const friend = (await friendQuery.get()).docs[0]?.data() as User;
  if (friend) {
    const friendRef = usersRef.doc(friend.id);
    const requests = [...friend.friendRequests, user.username];
    await friendRef.update({ friendRequests: requests });
  } else {
    throw new Error('No user with provided username.');
  }

  if (friend.messagingToken) {
    const message: Message = {
      notification: {
        title: user.username + ' added you as a friend!',
        body: 'tap to accept their request',
      },
      token: friend.messagingToken,
    };
    newNotification(message);
  }
};

export const sendNotificationToFriends = async (
  user: User,
  title: string,
  body: string
) => {
  for (const f of user.friends) {
    const friendRef = db.collection('users').doc(f.id);
    const friend = await friendRef.get();
    const friendMessagingToken = friend.get('messagingToken');
    if (!friendMessagingToken) continue;
    const message: Message = {
      notification: {
        title: title,
        body: body,
      },
      token: friendMessagingToken,
    };
    await newNotification(message);
  }
};
