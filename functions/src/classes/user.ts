import {
  DocumentReference,
  FieldValue,
  getFirestore,
} from 'firebase-admin/firestore';
import { Message } from 'firebase-admin/messaging';
import { SPOTIFY_AUTH } from '../lib/spotify';
import { getTrackGenre } from '../lib/gpt';
import { newNotification } from '../lib/notifications';
import {
  addSongsToSpotifyPlaylist,
  getCurrentSpotifySong,
  refreshSpotifyAccessCode,
  removeSongsFromSpotifyPlaylist,
  getSpotifySong,
} from '../lib/spotify';
import {
  Friend,
  MusicPlatform,
  MusicPlatformAuth,
  SavedSong,
  Song,
  SpotifyAuthRes,
  Submission as SubmissionType,
  UserStatistics,
  User as UserType,
} from '../types';
import Submission from './submission';
import { CustomError } from './error';
import { searchAppleMusic } from '@/lib/music-kit';
import { sendExceptionToSentry } from '@/lib/sentry';

const db = getFirestore();

export default class User implements UserType {
  // UserType
  id: string;
  email: string = '';
  messagingToken: string = '';
  musicPlatformAuth: MusicPlatformAuth = {} as MusicPlatformAuth;
  friends: Friend[] = [];
  friendRequests: string[] = []; // usernames
  savedSongs: SavedSong[] = []; // song ids
  likedSongsPlaylist: string = '';
  submissionsPlaylist: string = '';
  // this is in the database under /{user_id}/public/info
  public: UserType['public'] = {} as UserType['public'];
  // User
  musicPlatformAccessCode?: string;
  loaded = false;

  constructor(id: string) {
    if (!id) throw Error('No user id passed to constructor');
    this.id = id;
  }

  public get json() {
    return {
      id: this.id,
      email: this.email,
      messagingToken: this.messagingToken,
      musicPlatformAuth: this.musicPlatformAuth,
      friendRequests: this.friendRequests,
      friends: this.friends,
      likedSongsPlaylist: this.likedSongsPlaylist,
      submissionsPlaylist: this.submissionsPlaylist,
      public: this.public,
    } as UserType;
  }

  public async load(): Promise<User> {
    const res = await this.dbRef.get();
    if (res.exists) {
      for (const key in this) {
        if (key === 'public') {
          // get from 'public' sub-collection
          const info = await this.dbRef.collection('public').doc('info').get();
          if (info.exists) {
            this['public'] = info.data() as UserType['public'];
          } else {
            // info doesn't exists, run function to copy public info to the document
            this['public'] = await this.migratePublicInfo();
          }
        } else {
          this[key] = res.get(key) || this[key];
        }
      }
      this.loaded = true;
    } else {
      this.loaded = false;
    }
    return this;
  }

  public async migratePublicInfo() {
    const infoRef = this.dbRef.collection('public').doc('info');
    if ((await infoRef.get()).exists)
      return (await infoRef.get()).data() as UserType['public'];
    // create public info object
    const data = await this.dbRef.get();
    const publicInfo: UserType['public'] = {
      username: data.get('username'),
      musicPlatform: data.get('musicPlatform'),
      savedSongs: data.get('savedSongs'),
      profile: data.get('profile'),
    };
    // insert public info into the document
    infoRef.set(publicInfo);
    return publicInfo;
  }

  public async setMessagingToken(token: string) {
    if (!this.exists) throw Error('User not loaded.');
    if (!token) throw Error('No messaging token provided.');
    this.messagingToken = token;
    await this.dbRef.update({ messagingToken: token });
  }

  public async setUsername(username: string) {
    const usersRef = db.collection('users');
    if ((await usersRef.where('username', '==', username).get()).docs[0]) {
      throw new CustomError('Username taken. Please try another.');
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
        this.public.musicPlatform = musicPlatform;
        this.musicPlatformAuth = musicPlatformAuth;
        await this.dbRef.update({
          musicPlatform,
          musicPlatformAuth,
        });
      }
    } else {
      // apple music
      this.public.musicPlatform = musicPlatform;
      await this.dbRef.update({
        musicPlatform,
      });
    }
  }

  public async updateSpotifyAuth(): Promise<string> {
    if (!this.exists) throw Error('User not loaded.');
    if (!this.musicPlatformAuth)
      throw Error('No music platform authenticated.');
    const accessCode = await refreshSpotifyAccessCode(
      this.musicPlatformAuth,
      this.dbRef
    );
    this.musicPlatformAccessCode = accessCode;
    return accessCode;
  }

  public async saveSong(song: SavedSong): Promise<SavedSong> {
    if (!this.exists) throw Error('User not loaded.');
    const songsRef = this.dbRef.collection('songs');

    const songExists = this.savedSongs.find((s: SavedSong) => s.id === song.id);
    if (songExists) {
      return songExists;
    }

    const songRef = await songsRef.add(song);
    const songRes = await songRef.get();
    const songData = { ...songRes.data(), id: songRes.id } as SavedSong;

    // add the new song to the playlist
    if (this.likedSongsPlaylist) {
      if (this.public.musicPlatform === MusicPlatform.spotify) {
        await this.updateSpotifyAuth();
        // this doesn't need to be synchronous
        addSongsToSpotifyPlaylist(
          [song],
          this.likedSongsPlaylist,
          this.musicPlatformAuth
        );
      }
    }

    return songData;
  }

  public async unsaveSong(song: SavedSong) {
    if (!this.exists) throw Error('User not loaded.');
    if (!song?.id) throw new CustomError('No song provided.');
    const songsRef = this.dbRef.collection('songs');
    const songRef = songsRef.doc(song.id);

    // remove the song from the playlist
    if (this.likedSongsPlaylist) {
      if (this.public.musicPlatform === MusicPlatform.spotify) {
        await this.updateSpotifyAuth();
        // this doesn't need to synchronous
        removeSongsFromSpotifyPlaylist(
          [song],
          this.likedSongsPlaylist,
          this.musicPlatformAuth
        );
      }
    }

    await songRef.delete();
  }

  // GETTERS
  public async getSongs(): Promise<SavedSong[]> {
    if (!this.exists) throw Error('User not loaded.');
    const songs: SavedSong[] = [];
    const songsRef = this.dbRef.collection('songs');
    (await songsRef.get()).forEach((doc) => {
      const song = doc.data() as SavedSong;
      songs.push({ ...song, id: doc.id });
    });
    return songs;
  }

  public async getRecentSpotifySong(noGenre?: boolean): Promise<Song> {
    if (!this.exists) throw Error('User not loaded.');
    if (!this.musicPlatformAccessCode)
      throw Error('No access code provided. Cannot get most recent song.');
    const currentSong = await getCurrentSpotifySong(
      this.musicPlatformAccessCode
    );
    return {
      id: '',
      name: currentSong.item.name,
      platforms: [],
      artist: currentSong.item.artists[0]?.name,
      url: currentSong.item.external_urls.spotify,
      length: currentSong.item.duration_ms / 1000,
      durationElapsed: currentSong.progress_ms / 1000,
      albumArtwork: currentSong.item.album.images[0]?.url,
      timestamp: currentSong.timestamp || 0,
      genre:
        currentSong.item.artists[0]?.genres[0] ||
        (noGenre
          ? 'Unknown'
          : await getTrackGenre(
              currentSong.item.name,
              currentSong.item.artists[0]?.name
            )) ||
        'unkown',
    } as Song;
  }

  public async getSubmission(number?: number): Promise<Submission | undefined> {
    if (!this.id) throw Error('User not loaded.');
    const submissionRef = db
      .collection('submissions')
      .where(
        'number',
        '==',
        number != null ? number : await Submission.getCurrentCount()
      )
      .where('userId', '==', this.id);
    const submissionRes = await submissionRef.get();
    if (submissionRes.empty) return;
    const submissionData = submissionRes.docs[0].data() as SubmissionType;
    return new Submission(
      submissionRes.docs[0].id,
      submissionData.number,
      submissionData.song,
      submissionData.audial,
      submissionData.location,
      submissionData.late,
      submissionData.time,
      submissionData.lateTime,
      submissionData.comments,
      undefined,
      submissionData.caption,
      submissionData.likes,
      this
    );
  }

  public async getFriendSubmissions(number?: number): Promise<Submission[]> {
    if (!this.exists) throw Error('User not loaded.');
    const friendSubmissions: Submission[] = [];
    for (const localFriend of this.friends) {
      const friend = new User(localFriend.id);
      await friend.load();
      try {
        const friendSub = await friend.getSubmission(number);
        if (!friendSub) continue;
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

  // METHODS
  public async sendNotification(
    title: string,
    body: string,
    data?: Message['data']
  ) {
    if (!this.exists) throw Error('User not loaded.');
    if (!this.messagingToken) throw Error('User has no notification support.');
    const message: Message = {
      notification: {
        title: title,
        body: body,
      },
      data,
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

  public async previewSubmission(appleMusicSong: Song): Promise<Submission> {
    if (!this.exists) throw Error('User not loaded.');
    // make sure we have the latest access tokens for the user's music oauth before we get their song
    let song = {} as Song;
    if (this.public.musicPlatform === MusicPlatform.spotify) {
      await this.updateSpotifyAuth();
      song = await this.getRecentSpotifySong();
      song.platforms.push({
        id: MusicPlatform.spotify,
        url: song.url,
        artist: song.artist,
        name: song.name,
        albumArtwork: song.albumArtwork,
      });
      const appleMusicRes = await searchAppleMusic(
        song.name + ' by ' + song.artist,
        ['track']
      );
      if (appleMusicRes) {
        song.platforms.push({
          id: MusicPlatform.appleMusic,
          url: appleMusicRes.results.songs?.data[0]?.attributes?.url || '',
          name: appleMusicRes.results.songs?.data[0]?.attributes?.name || '',
          artist:
            appleMusicRes.results.songs?.data[0]?.attributes.artistName || '',
          albumArtwork:
            appleMusicRes.results.songs?.data[0]?.attributes?.artwork?.url
              .replace('{w}', '120')
              .replace('{h}', '120') || '',
        });
      }
    }
    if (this.public.musicPlatform === MusicPlatform.appleMusic) {
      song = {
        ...appleMusicSong,
        platforms: [],
        genre:
          (await getTrackGenre(appleMusicSong.name, appleMusicSong.artist)) ||
          'unknown',
      };
      song.platforms.push({
        id: MusicPlatform.appleMusic,
        url: song.url,
        name: song.name,
        artist: song.artist,
        albumArtwork: song.albumArtwork,
      });
      // spotify information
      const spotifySong = await getSpotifySong(song);
      song.platforms.push({
        id: MusicPlatform.spotify,
        url: spotifySong?.external_urls.spotify || '',
        name: spotifySong?.name || '',
        artist: spotifySong?.artists[0]?.name || '',
        albumArtwork: spotifySong?.album.images[0]?.url || '',
      });
    }

    // get a snapshot of the current submission state
    const notificationsSnapshot = await db
      .collection('misc')
      .doc('notifications')
      .get();
    // calculate time and late information if the submission is late
    const { late, time, lateTime } = Submission.calculateCurrentTimeData(
      notificationsSnapshot
    );
    // create the submission
    const newSubmission: SubmissionType = {
      id: '',
      time,
      late,
      lateTime,
      number: notificationsSnapshot.get('count'),
      audial: { number: -1, score: '' },
      song,
      location: { latitude: 0, longitude: 0 },
      comments: [],
      userId: this.id,
      caption: '',
      likes: [],
    };

    // return a new submission class from the result
    return new Submission(
      '69',
      newSubmission.number,
      newSubmission.song,
      newSubmission.audial,
      newSubmission.location,
      newSubmission.late,
      newSubmission.time,
      newSubmission.lateTime,
      newSubmission.comments,
      song.timestamp === 0 ? song : undefined,
      newSubmission.caption,
      newSubmission.likes,
      this
    );
  }

  public async createSubmission(
    latitude: number,
    longitude: number,
    appleMusicSong: Song
  ): Promise<Submission> {
    if (!this.exists) throw Error('User not loaded.');
    // perform verification checks for this new submission
    const notificationsSnapshot = await db
      .collection('misc')
      .doc('notifications')
      .get();
    if (!(await Submission.canCreate(this.id, notificationsSnapshot))) {
      throw new CustomError('User already submitted.');
    }
    // make sure we have the latest access tokens for the user's music oauth before we get their song
    let song = {} as Song;
    if (this.public.musicPlatform === MusicPlatform.spotify) {
      await this.updateSpotifyAuth();
      song = await this.getRecentSpotifySong();
      song.platforms.push({
        id: MusicPlatform.spotify,
        url: song.url,
        artist: song.artist,
        name: song.name,
        albumArtwork: song.albumArtwork,
      });
      const appleMusicRes = await searchAppleMusic(
        song.name + ' by ' + song.artist,
        ['track']
      ).catch((e) => {
        sendExceptionToSentry('function-create-submission', e, {
          user_id: this.id,
        });
      });
      if (appleMusicRes) {
        song.platforms.push({
          id: MusicPlatform.appleMusic,
          url: appleMusicRes.results.songs?.data[0]?.attributes?.url || '',
          name: appleMusicRes.results.songs?.data[0]?.attributes?.name || '',
          artist:
            appleMusicRes.results.songs?.data[0]?.attributes.artistName || '',
          albumArtwork:
            appleMusicRes.results.songs?.data[0]?.attributes?.artwork?.url
              .replace('{w}', '120')
              .replace('{h}', '120') || '',
        });
      }
    }
    if (this.public.musicPlatform === MusicPlatform.appleMusic) {
      song = {
        ...appleMusicSong,
        platforms: [],
        genre:
          (await getTrackGenre(appleMusicSong.name, appleMusicSong.artist)) ||
          'unknown',
      };
      song.platforms.push({
        id: MusicPlatform.appleMusic,
        url: song.url,
        name: song.name,
        artist: song.artist,
        albumArtwork: song.albumArtwork,
      });
      // spotify information
      const spotifySong = await getSpotifySong(song);
      song.platforms.push({
        id: MusicPlatform.spotify,
        url: spotifySong?.external_urls.spotify || '',
        name: spotifySong?.name || '',
        artist: spotifySong?.artists[0]?.name || '',
        albumArtwork: spotifySong?.album.images[0]?.url || '',
      });
    }

    // calculate time and late information if the submission is late
    const { late, time, lateTime } = Submission.calculateCurrentTimeData(
      notificationsSnapshot
    );
    // create and store the submission
    const newSubmission: SubmissionType = {
      id: '',
      time,
      late,
      lateTime,
      number: notificationsSnapshot.get('count'),
      audial: { number: -1, score: '' },
      song,
      location: { latitude: latitude || 135, longitude: longitude || 90.0 },
      comments: [],
      userId: this.id,
      likes: [],
    };
    const newSubmissionId = (
      await db.collection('submissions').add(newSubmission)
    ).id;
    // send notification on late submission
    if (late) {
      // don't await so it happens asynchonously
      this.sendNotificationToFriends(
        'late submission',
        `${this.public.username} just shared what they're listening to.`,
        { type: 'late-submission', id: newSubmissionId }
      );
    }

    try {
      // wrap this so it happens asynchonously
      (async () => {
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
          if (!sub.user) continue;
          friendIds.push(sub.user.id);
        }
        for (const fid of friendIds) {
          if (!fid) continue;
          const friend = new User(fid);
          await friend.load();
          await friend.updateSpotifyAuth();
          if (song) {
            await addSongsToSpotifyPlaylist(
              [song],
              friend.submissionsPlaylist,
              friend.musicPlatformAuth
            );
          }
        }
      })();
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
      newSubmission.comments,
      undefined,
      newSubmission.caption,
      newSubmission.likes,
      this
    );
  }

  public async sendNotificationToFriends(
    title: string,
    body: string,
    data?: Message['data']
  ) {
    if (!this.exists) throw Error('User not loaded.');
    for (const f of this.friends) {
      const friend = new User(f.id);
      await friend.load();
      if (!friend.messagingToken) continue;
      friend.sendNotification(title, body, data);
    }
  }

  public async acceptRequest(requester: string) {
    if (!requester) throw new CustomError('No requester provided');
    const usersRef = db.collection('users');
    const friendQuery = usersRef.where('username', '==', requester);
    const friend = (await friendQuery.get()).docs[0]?.data() as UserType;
    // if we have such a friend and there is an actual request from them to the user
    if (
      !friend ||
      !this.friendRequests.find((u) => u === friend.public.username)
    )
      throw new CustomError('Friend request does not exist.');
    // update user friends
    const userFriends = this.friends;
    this.friends.push({ username: friend.public.username, id: friend.id });
    // doesn't need to be synchronous
    this.dbRef.update({ friends: userFriends });
    // remove from friend request array
    const userFriendRequests = this.friendRequests;
    const updatedRequests = userFriendRequests.filter(
      (u) => u !== friend.public.username
    );
    // doesn't need to be synchronous
    this.dbRef.update({ friendRequests: updatedRequests });

    // update friend friends
    const friendFriends = friend.friends;
    friendFriends.push({ username: this.public.username, id: this.id });
    const friendRef = usersRef.doc(friend.id);
    // doesn't need to be synchronous
    friendRef.update({ friends: friendFriends });

    // send notification
    if (!friend.messagingToken) return;
    const message: Message = {
      notification: {
        title: this.public.username + ' accepted your friend request!',
        body: "tap to see what they're listening to",
      },
      data: {
        type: 'request-accept',
        friendId: this.id,
      },
      token: friend.messagingToken,
      apns: {
        payload: {
          aps: {
            badge: 1,
          },
        },
      },
    };
    // does'nt need to be synchronous
    newNotification(message);
    return this.json;
  }

  public async rejectRequest(requester: string) {
    if (!requester) throw new CustomError('No requester provided');
    const usersRef = db.collection('users');
    const friendQuery = usersRef.where('username', '==', requester);
    const friend = (await friendQuery.get()).docs[0]?.data() as UserType;
    // if we have such a friend and there is an actual request from them to the user
    if (
      !friend ||
      !this.friendRequests.find((u) => u === friend.public.username)
    )
      throw new CustomError('Friend request does not exist.');
    // remove from friend request array
    const userFriendRequests = this.friendRequests;
    const updatedRequests = userFriendRequests.filter(
      (u) => u !== friend.public.username
    );
    // doesn't need to be synchronous
    this.dbRef.update({ friendRequests: updatedRequests });
    return this.json;
  }

  public async sendRequest(username: string) {
    if (!username) throw new CustomError('No username provided');
    const usersRef = db.collection('users');
    const friendQuery = usersRef.where('username', '==', username);
    const friend = (await friendQuery.get()).docs[0]?.data() as User;
    if (!friend) throw new CustomError('No user with provided username.');
    const friendRef = usersRef.doc(friend.id);
    if (friend.friendRequests.find((r) => r === this.public.username)) return;
    const requests = [...friend.friendRequests, this.public.username];
    await friendRef.update({ friendRequests: requests });
    if (!friend.messagingToken) return;
    const message: Message = {
      notification: {
        title: this.public.username + ' added you as a friend!',
        body: 'tap to accept their request',
      },
      token: friend.messagingToken,
      data: {
        type: 'request-create',
        id: this.id,
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
          },
        },
      },
    };
    newNotification(message);
  }

  public async getStatistics() {
    if (!this.exists) throw Error('User not loaded.');
    const stats = {} as UserStatistics;
    stats.onTimeSubmissionCount = 0;
    const popSongs = [] as (Song & { appearances: number })[];
    const submissionsRef = await db
      .collection('submissions')
      .where('userId', '==', this.id)
      .get();
    stats.submissionCount = submissionsRef.size;
    for (const doc of submissionsRef.docs) {
      const sub = doc.data() as SubmissionType;
      // percentange
      if (!sub.late) stats.onTimeSubmissionCount++;
      // calculate popular song
      const songIndex = popSongs.findIndex(
        (s) => s.name === sub.song.name && s.artist === sub.song.artist
      );
      if (songIndex === -1) popSongs.push({ ...sub.song, appearances: 1 });
      else {
        if (!popSongs[songIndex]?.albumArtwork && sub?.song?.albumArtwork) {
          popSongs[songIndex].albumArtwork = sub?.song?.albumArtwork;
        }
        popSongs[songIndex].appearances += 1;
      }
    }
    stats.topSong = popSongs.sort((a, b) => b.appearances - a.appearances)[0];
    return stats;
  }

  public async setProfile(profile: UserType['public']['profile']) {
    if (!profile) throw new CustomError('No new profile provided.');
    this.public.profile = profile;
    await this.dbRef.update({ profile: this.public.profile });
  }

  public async getFriendSuggestions(): Promise<
    { username: string; mutual?: string }[]
  > {
    if (!this.exists) throw Error('User not loaded.');
    const suggestions: { username: string; mutual?: string }[] = [];

    for (const localFriend of this.friends) {
      const friend = new User(localFriend.id);
      await friend.load();
      for (const friendFriend of friend.friends) {
        // make sure not to add this username to the list if this user is already friends with them
        //      or if the username is this user's username
        //      or if the username is already in the suggestions list
        //todo:
        //      or if the user already has a friend request out for the username
        //      or if the user decided to ignore the username's suggestion
        if (
          !this.friends.find((f) => f.username === friendFriend.username) &&
          friendFriend.username !== this.public.username &&
          !suggestions.find((s) => s.username === friendFriend.username)
        ) {
          suggestions.push({
            username: friendFriend.username,
            mutual: localFriend.username,
          });
        }
      }
      //todo: get suggestions from nearby submissions
    }
    return suggestions;
  }

  public async delete() {
    if (!this.loaded) await this.load();
    for (const fr of this.friends) {
      const friend = new User(fr.id);
      await friend.removeFriend({
        id: this.id,
        username: this.public.username,
      });
    }
    await this.dbRef.delete();
  }

  public async removeFriend(friend: { id: string; username: string }) {
    this.dbRef.update({ friends: FieldValue.arrayRemove(friend) });
  }

  public async getCurrentlyListening(): Promise<Song | undefined> {
    if (!this.loaded) await this.load();
    if (this.public.musicPlatform !== MusicPlatform.spotify) return;
    try {
      await this.updateSpotifyAuth();
      let song = await this.getRecentSpotifySong(true);
      if (song.timestamp) return;
      return song;
    } catch (e: any) {
      if (!e.message.includes('Spotify now playing error'))
        console.log('user.getCurrentlyListening:', e);
    }
    return;
  }

  //STATIC METHODS
  static async create(user: UserType) {
    // check if the email. username already exists
    const usersRef = db.collection('users');
    if ((await usersRef.where('email', '==', user.email).get()).docs[0]) {
      throw new CustomError(`Email '${user.email}' already registered.`);
    }

    if ((await usersRef.doc(user.id).get()).exists) {
      throw new CustomError(
        'User ID taken. (Perhaps the user has already registered.)'
      );
    }

    const newUserRef = db.collection('users').doc(user.id);
    user.friends = [];
    user.friendRequests = [];
    await newUserRef.set({ ...user, musicPlatform: '' });
    return user;
  }

  static async getByUsername(username: string) {
    const ref = db.collection('users').where('username', '==', username);
    const res = await ref.get();
    if (!res.docs[0])
      throw new CustomError(`No user with username ${username} found.`);
    const u = new User(res.docs[0].id);
    await u.load();
    return u;
  }
}
