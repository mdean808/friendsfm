import { getFirestore } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import { MusicPlatform, SpotifyAuthRes, User } from '../../types';

export const SPOTIFY_AUTH = Buffer.from(
  process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
).toString('base64');

const db = getFirestore();

//WARN: Deprecated
export const _updateUserMessagingToken = async (
  id: string,
  messagingToken: string
) => {
  if (!id) throw Error('No user id provided.');
  if (!messagingToken) throw Error('No messaging token provided.');
  const usersRef = db.collection('users');
  const res = usersRef.doc(id);
  if (!(await res.get()).exists)
    throw new Error('User of given id does not exist.');
  await res.update({ messagingToken });
};

export const getUserById = async (uid: string) => {
  const usersRef = db.collection('users');
  const res = await usersRef.doc(uid).get();
  return res.data() as User;
};

export const createUser = async (user: User) => {
  // check if the email. username already exists
  const usersRef = db.collection('users');
  if ((await usersRef.where('email', '==', user.email).get()).docs[0]) {
    throw new Error(`Email '${user.email}' already registered.`);
  }

  if ((await usersRef.doc(user.id).get()).exists) {
    throw new Error(
      'User ID taken. (Perhaps the user has already registered.)'
    );
  }

  const newUserRef = db.collection('users').doc(user.id);
  user.friends = [];
  user.username = user.id;
  user.friendRequests = [];
  await newUserRef.set(user);
  functions.logger.info('User inserted into database:', user.id);
  return user;
};

//WARN: Deprecated
export const _setUserUsername = async (id: string, username: string) => {
  const usersRef = db.collection('users');
  const user = usersRef.doc(id);
  if ((await usersRef.where('username', '==', username).get()).docs[0]) {
    throw new Error('Username taken. Please try another.');
  } else {
    const userFriends = (await user.get()).get('friends') as {
      id: string;
      username: string;
    }[];
    for (const friend of userFriends) {
      const friendRef = usersRef.doc(friend.id);
      const friendFriends = (await friendRef.get()).get('friends') as {
        id: string;
        username: string;
      }[];
      for (const userWithinFriendFriends of friendFriends) {
        if (userWithinFriendFriends.id === id)
          userWithinFriendFriends.username = username;
      }
      friendRef.update({ friends: friendFriends });
    }
    await user.update({ username });
  }
};

//WARN: Deprecated
export const _setUserMusicPlatform = async (
  id: string,
  musicPlatform: string,
  platformAuthCode: string
) => {
  if (!id) throw new Error('No user provided.');
  if (!musicPlatform) throw new Error('No music platform preference provided.');
  const usersRef = db.collection('users');
  const user = usersRef.doc(id);
  // spotify
  if (musicPlatform === MusicPlatform.spotify) {
    const body = new URLSearchParams();
    body.append('grant_type', 'authorization_code');
    body.append('code', platformAuthCode);
    body.append('redirect_uri', process.env.SPOTIFY_REDIRECT_URL || '');

    const res = await fetch('https://accounts.spotify.com/api/token', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + SPOTIFY_AUTH,
      },
      method: 'post',
      body,
    });
    if (res.status !== 200) {
    } else {
      const spotifyAuthRes: SpotifyAuthRes = await res.json();
      const musicPlatformAuth = {
        expires_at: new Date(Date.now() + spotifyAuthRes.expires_in * 1000),
        access_token: spotifyAuthRes.access_token,
        refresh_token: spotifyAuthRes.refresh_token,
      };
      await user.update({
        musicPlatform,
        musicPlatformAuth,
      });
    }
  } else {
    // apple music
    await user.update({ musicPlatform });
  }
};
