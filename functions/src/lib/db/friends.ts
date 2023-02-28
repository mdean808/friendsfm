import { getFirestore } from 'firebase-admin/firestore';
import { User } from '../../types';

const db = getFirestore();

export const acceptFriendRequest = async (
  user: User,
  requestUsername: string
) => {
  if (!requestUsername) throw new Error('No requester provided');
  const usersRef = db.collection('users');
  const friendQuery = usersRef.where('username', '==', requestUsername);
  const friend = (await friendQuery.get()).docs[0].data() as User;
  // if we have such a friend and there is an actual request from them to the user
  if (friend && user.friendRequests.find((u) => u === friend.username)) {
    // update user friends
    const userFriends = user.friends;
    userFriends.push({ username: friend.username, id: friend.uid });
    const userRef = usersRef.doc(user.uid);
    await userRef.update({ friends: userFriends });
    // remove from friend request array
    const userFriendRequests = user.friendRequests;
    const updatedRequests = userFriendRequests.filter(
      (u) => u !== friend.username
    );
    await userRef.update({ friendRequests: updatedRequests });

    // update friend friends
    const friendFriends = friend.friends;
    friendFriends.push({ username: friend.username, id: user.uid });
    const friendRef = usersRef.doc(friend.uid);
    await friendRef.update({ friends: friendFriends });
    return (await userRef.get()).data() as User;
  } else {
    throw new Error('Friend request does not exist.');
  }
};

export const sendFriendRequest = async (user: User, friendUsername: string) => {
  if (!friendUsername) throw new Error('No username provided');

  const usersRef = db.collection('users');
  const friendQuery = usersRef.where('username', '==', friendUsername);
  const friend = (await friendQuery.get()).docs[0].data() as User;
  if (friend) {
    const friendRef = usersRef.doc(friend.id);
    const requests = [...friend.friendRequests, user.username];
    await friendRef.update({ friendRequests: requests });
  } else {
    throw new Error('No user with provided username.');
  }
};
