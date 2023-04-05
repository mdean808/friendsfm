import { DocumentReference, getFirestore } from 'firebase-admin/firestore';
import { Message } from 'firebase-admin/messaging';
import { SPOTIFY_AUTH } from '../lib/db';
import { getTrackGenre } from '../lib/gpt';
import { newNotification } from '../lib/notifications';
import {
  addSongsToSpotifyPlaylist,
  getCurrentSpotifySong,
  refreshSpotifyAccessCode,
} from '../lib/spotify';
import {
  Friend,
  MusicPlatform,
  MusicPlatformAuth,
  SavedSong,
  Song,
  SpotifyAuthRes,
  Submission as SubmissionType,
  User as UserType,
} from '../types';
import Submission from './submission';

const db = getFirestore();

export default class User {
  id: string;
  email: string = '';
  likedSongsPlaylist: string = '';
  submissionsPlaylist: string = '';
  musicPlatformAuth: MusicPlatformAuth = {} as MusicPlatformAuth;
  displayName: string = '';
  photoURL: string = '';
  username: string = '';
  musicPlatform: MusicPlatform = MusicPlatform.spotify;
  friends: Friend[] = [];
  friendRequests: string[] = []; // usernames
  submissions: string[] = []; // submission ids
  savedSongs: string[] = []; // song ids
  messagingToken: string = '';
  authToken: string = '';
  musicPlatformAcessCode?: string;
  loaded = false;

  constructor(id: string, authToken?: string) {
    if (!id) throw Error('No user id passed to constructor');
    this.id = id;
    this.authToken = authToken || '';
  }

  public async load(): Promise<User> {
    const res = await this.dbRef.get();
    for (const key in this) {
      this[key] = res.get(key) || this[key];
    }
    this.loaded = true;
    return this;
  }

  public get json() {
    return {
      id: this.id,
      email: this.email,
      likedSongsPlaylist: this.likedSongsPlaylist,
      submissionsPlaylist: this.likedSongsPlaylist,
      musicPlatformAuth: this.musicPlatformAuth,
      displayName: this.displayName,
      photoURL: this.photoURL,
      username: this.username,
      musicPlatform: this.musicPlatform,
      friends: this.friends,
      friendRequests: this.friendRequests,
      submissions: this.submissions,
      savedSongs: this.savedSongs,
      messagingToken: this.messagingToken,
      authToken: this.authToken,
    } as UserType;
  }

  public async setMessagingToken(token: string) {
    if (!this.exists) throw Error('User not loaded.');
    if (!token) throw Error('No messaging token provided.');
    await this.dbRef.update({ token });
  }

  public async getSongs() {
    if (!this.exists) throw Error('User not loaded.');
    const songs: SavedSong[] = [];
    const songsRef = this.dbRef.collection('songs');
    (await songsRef.get()).forEach((doc) => {
      const song = doc.data() as SavedSong;
      songs.push({ ...song, id: doc.id });
    });
    return songs;
  }

  public async setUsername(username: string) {
    const usersRef = db.collection('users');
    if ((await usersRef.where('username', '==', username).get()).docs[0]) {
      throw new Error('Username taken. Please try another.');
    } else {
      const userFriends = this.friends as {
        id: string;
        username: string;
      }[];
      for (const friend of userFriends) {
        const f = new User(friend.id);
        await f.load();
        const friendFriends = f.friends as {
          id: string;
          username: string;
        }[];
        for (const userWithinFriendFriends of friendFriends) {
          if (userWithinFriendFriends.id === this.id)
            userWithinFriendFriends.username = username;
        }
        f.dbRef.update({ friends: friendFriends });
      }
      await this.dbRef.update({ username });
    }
  }

  public async setMusicPlatform(
    musicPlatform: MusicPlatform,
    authCode: string
  ) {
    if (musicPlatform === MusicPlatform.spotify) {
      const body = new URLSearchParams();
      body.append('grant_type', 'authorization_code');
      body.append('code', authCode);
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
        await this.dbRef.update({
          musicPlatform,
          musicPlatformAuth,
        });
      }
    } else {
      // apple music
    }
  }

  public async updateMusicAuth(): Promise<string> {
    if (!this.exists) throw Error('User not loaded.');
    if (!this.musicPlatformAuth)
      throw Error('No music platform authenticated.');
    if (this.musicPlatform == MusicPlatform.spotify) {
      const accessCode = await refreshSpotifyAccessCode(
        this.musicPlatformAuth,
        this.dbRef
      );
      this.musicPlatformAcessCode = accessCode;
      return accessCode;
    } else if (this.musicPlatform == MusicPlatform.appleMusic) {
      throw Error('Apple Music support coming soon!');
    } else {
      throw Error('Unknown music platform.');
    }
  }

  public async getRecentSong(): Promise<Song> {
    if (!this.exists) throw Error('User not loaded.');
    if (!this.musicPlatformAcessCode)
      throw Error('No access code provided. Cannot get most recent song.');
    if (this.musicPlatform == MusicPlatform.spotify) {
      const currentSong = await getCurrentSpotifySong(
        this.musicPlatformAcessCode
      );
      return {
        id: '',
        name: currentSong.item.name,
        artist: currentSong.item.artists[0]?.name,
        url: currentSong.item.external_urls.spotify,
        length: currentSong.item.duration_ms / 1000,
        durationElapsed: currentSong.progress_ms / 1000,
        timestamp: currentSong.timestamp || 0,
        genre:
          (await getTrackGenre(
            currentSong.item.name,
            currentSong.item.artists[0]?.name
          )) || 'unkown',
      } as Song;
    } else if (this.musicPlatform == MusicPlatform.appleMusic) {
      throw Error('Apple Music support coming soon!');
    } else {
      throw Error('Unknown music platform.');
    }
  }

  public async sendNotification(title: string, body: string) {
    if (!this.exists) throw Error('User not loaded.');
    if (!this.messagingToken) throw Error('User has no notification support.');
    const message: Message = {
      notification: {
        title: title,
        body: body,
      },
      token: this.messagingToken,
      apns: {
        payload: {
          aps: {
            badge: 1,
          },
        },
      },
    };
    await newNotification(message);
  }

  public async createSubmission(
    latitude: number,
    longitude: number
  ): Promise<Submission> {
    if (!this.exists) throw Error('User not loaded.');
    // perform verification checks for this new submission
    const notificationsSnapshot = await db
      .collection('misc')
      .doc('notifications')
      .get();
    if (!(await Submission.canCreate(this.dbRef, notificationsSnapshot))) {
      throw new Error('User already submitted.');
    }
    // make sure we have the latest access tokens for the user's music oauth before we get their song
    await this.updateMusicAuth();
    const song = await this.getRecentSong();

    // calculate time and late information if the submission is late
    const { late, time, lateTime } = Submission.calculateCurrentTimeData(
      notificationsSnapshot
    );
    // create and store the submission
    const newSubmission = {
      time,
      late,
      lateTime,
      number: notificationsSnapshot.get('count'),
      audial: { number: -1, score: '' },
      song,
      location: { latitude, longitude },
    };
    const newSubmissionId = (
      await this.dbRef.collection('submissions').add(newSubmission)
    ).id;
    // send notification on late submission
    if (late) {
      //  don't await this becuase we don't want to make the user wait even more!
      this.sendNotificationToFriends(
        'late submission',
        `${this.username} just shared what they're listening to.`
      );
    }

    try {
      // Add submission song + friend submission songs to user's playlist
      const friendSubmissions = await this.getFriendSubmissions();
      if (this.submissionsPlaylist) {
        const songs: Song[] = [];
        if (song) songs.push(song);
        for (const sub of friendSubmissions) {
          songs.push(sub.song);
        }
        await addSongsToSpotifyPlaylist(
          songs,
          this.submissionsPlaylist,
          this.musicPlatformAuth
        );
      }
      // Add submission song to their friend's playlists
      const friendIds = [];
      for (const sub of friendSubmissions) {
        friendIds.push(sub.user.id);
      }
      for (const fid of friendIds) {
        const friend = new User(fid);
        await friend.load();
        await friend.updateMusicAuth();
        if (song) {
          await addSongsToSpotifyPlaylist(
            [song],
            friend.submissionsPlaylist,
            friend.musicPlatformAuth
          );
        }
      }
    } catch (e) {
      console.log(e);
    }
    // return a new submission class from the result
    return new Submission(
      newSubmissionId,
      newSubmission.number,
      newSubmission.song,
      newSubmission.audial,
      newSubmission.location,
      newSubmission.late,
      newSubmission.time,
      newSubmission.lateTime,
      this
    );
  }

  public async sendNotificationToFriends(title: string, body: string) {
    if (!this.exists) throw Error('User not loaded.');
    for (const f of this.friends) {
      const friend = new User(f.id);
      await friend.load();
      if (!friend.messagingToken) continue;
      friend.sendNotification(title, body);
    }
  }

  public async getCurrentSubmission(): Promise<Submission> {
    if (!this.exists) throw Error('User not loaded.');
    const submissionRef = this.dbRef
      .collection('submissions')
      .where('number', '==', await Submission.getCurrentCount());
    const submissionRes = await submissionRef.get();
    if (submissionRes.empty) throw Error('No Current Submission');
    const submissionData = submissionRes.docs[0].data() as SubmissionType;
    return new Submission(
      submissionData.id,
      submissionData.number,
      submissionData.song,
      submissionData.audial,
      submissionData.location,
      submissionData.late,
      submissionData.time,
      submissionData.lateTime,
      this
    );
  }

  public async getFriendSubmissions(): Promise<Submission[]> {
    if (!this.exists) throw Error('User not loaded.');
    const friendSubmissions: Submission[] = [];
    for (const localFriend of this.friends) {
      const friend = new User(localFriend.id);
      await friend.load();
      try {
        const friendSub = await friend.getCurrentSubmission();
        friendSub.formatDatesForFrontend();
        friendSubmissions.push(friendSub);
      } catch (e) {
        if (!(e as Error).message.includes('No Current Submission')) {
          console.error(e);
        }
      }
    }

    return friendSubmissions;
  }

  public get dbRef(): DocumentReference {
    return db.collection('users').doc(this.id);
  }

  public get exists(): boolean {
    return this.loaded;
  }
}
