import {
  DocumentReference,
  DocumentSnapshot,
  getFirestore,
  Timestamp,
  FieldValue,
} from 'firebase-admin/firestore';
import {
  Audial,
  MusicPlatform,
  Song,
  Submission as SubmissionType,
  Location,
  Comment,
} from '../types';
import User from './user';
import { randomUUID } from 'crypto';
import { CustomError } from './error';

const db = getFirestore();

export default class Submission implements SubmissionType {
  id: string;
  number: number;
  late: boolean;
  song: Song;
  time: Date | Timestamp;
  audial: Audial;
  user: {
    username: string;
    musicPlatform?: MusicPlatform;
    id: string;
  };
  location: Location;
  lateTime: Date | Timestamp;
  comments: Comment[];
  userId: string;
  currentlyListening?: Song | undefined;

  constructor(
    id: string,
    number?: number,
    song?: Song,
    audial?: Audial,
    location?: { longitude: number; latitude: number },
    late?: boolean,
    time?: Date | Timestamp,
    lateTime?: Date | Timestamp,
    comments?: Comment[],
    currentlyListening?: Song,
    user?: User
  ) {
    this.id = id;
    this.number = number || -1;
    this.song = song || ({} as Song);
    this.audial = audial || ({} as Audial);
    this.location = location || ({} as Location);
    this.late = late || false;
    this.time = time || new Date();
    this.lateTime = lateTime || new Date();
    this.comments = comments || [];
    this.currentlyListening = currentlyListening;
    this.user = {
      id: user?.id || '',
      username: user?.username || '',
      musicPlatform: user?.musicPlatform || MusicPlatform.spotify,
    };
    this.userId = user?.id || '';
  }

  public async load(): Promise<Submission> {
    const res = await this.dbRef.get();
    for (const key in this) {
      this[key] = res.get(key.toString()) || this[key];
    }
    const u = new User(this.userId);
    await u.load();
    this.user.id = u.id;
    this.user.username = u.username;
    this.user.musicPlatform = u.musicPlatform;
    this.currentlyListening = await u.getCurrentlyListening();
    return this;
  }

  public formatDatesForFrontend() {
    if ((this.time as Timestamp).toDate)
      this.time = (this.time as Timestamp).toDate();
    if ((this.lateTime as Timestamp).toDate)
      this.lateTime = (this.lateTime as Timestamp).toDate();
  }
  public formatDatesForFirebase() {
    if (!(this.time as Timestamp).toDate)
      this.time = Timestamp.fromDate(this.time as Date);
    if (!(this.lateTime as Timestamp).toDate)
      this.lateTime = Timestamp.fromDate(this.lateTime as Date);
  }

  public get dbRef(): DocumentReference {
    return db.collection('submissions').doc(this.id);
  }

  public get json(): SubmissionType {
    this.formatDatesForFrontend();
    return {
      id: this.id,
      number: this.number,
      song: this.song,
      audial: this.audial,
      location: this.location,
      late: this.late,
      time: this.time,
      lateTime: this.lateTime,
      comments: this.comments,
      user: this.user,
      userId: this.user.id,
      currentlyListening: this.currentlyListening,
    };
  }

  public async setAudial(audial: Audial) {
    if (!audial || !audial.score || !audial.number)
      throw new CustomError('Invalid audial provided');
    await this.dbRef.update({ audial });
  }

  // user is the person who added the comment
  public async addComment(content: string, user: User): Promise<Comment> {
    if (!content) throw new CustomError('No comment content provided');
    const comment = {
      id: randomUUID(),
      content,
      user: { id: user.id, username: user.username },
    };
    // add comment to submission in db and then locally
    await this.dbRef.update({
      comments: FieldValue.arrayUnion(comment),
    });
    this.comments.push(comment);

    const notifsSentToUsernames: string[] = [];
    // send notification to the current submission user
    // IF the submission user is not the commenter
    const subUser = new User(this.userId);
    if (this.userId !== user.id) {
      await subUser.load();
      notifsSentToUsernames.push(subUser.username);
      subUser.sendNotification(`${user.username} commented`, content, {
        type: 'comment',
        id: this.id,
      });
    }
    // send notification to anyone else who commented
    // filter comments so we just get one from each commenter
    for (const c of Object.values(
      this.comments.reduce(
        (acc, comment) => ({ ...acc, [comment.user.id]: comment }),
        {} as Comment
      )
    )) {
      // make sure the comment exists
      if (!c) continue;
      const u = new User(c.user.id);
      // IF the comment is not the submission user AND the commenter has not made a comment previously
      if (this.userId !== u.id && u.id !== user.id) {
        const u = new User(c.user.id);
        await u.load();
        notifsSentToUsernames.push(u.username);
        u.sendNotification(`${user.username} commented`, content, {
          type: 'comment',
          id: this.id,
        });
      }
    }
    // grab usernames in the comment
    const usernamesInContent = comment.content
      .split(' ')
      .filter((word) => word.startsWith('@'))
      .map((word) => word.slice(1));

    // make sure we don't send duplicate notifications
    const uniqueUsernames = [
      ...new Set(
        usernamesInContent
          .filter((x) => !notifsSentToUsernames.includes(x))
          .concat(
            notifsSentToUsernames.filter((x) => !usernamesInContent.includes(x))
          )
      ),
    ];

    // send notification to anyone who was mentioned
    for (const username of uniqueUsernames) {
      if (notifsSentToUsernames.find((u) => u === username)) continue;
      User.getByUsername(username).then((u) => {
        u.sendNotification(
          `${user.username} mentioned you in a comment`,
          content,
          {
            type: 'comment',
            id: this.id,
          }
        );
      });
      notifsSentToUsernames.push(username);
    }

    return comment;
  }

  public async removeComment(comment: Comment) {
    if (!comment) throw new CustomError('No comment provided');
    await this.dbRef.update({
      comments: FieldValue.arrayRemove(comment),
    });
  }

  public static async getCurrentCount() {
    return (await db.collection('misc').doc('notifications').get()).get(
      'count'
    );
  }

  public static async canCreate(
    userId: string,
    notificationsSnapshot: DocumentSnapshot
  ): Promise<boolean> {
    const currentSubmissionCount = notificationsSnapshot.get('count');
    const submissionsRef = db.collection('submissions');
    const existingSubmission = await submissionsRef
      .where('userId', '==', userId)
      .where('number', '==', currentSubmissionCount)
      .get();
    return existingSubmission.empty;
  }

  public static calculateCurrentTimeData(
    notificationsSnapshot: DocumentSnapshot
  ): {
    late: boolean;
    time: Timestamp;
    lateTime: Timestamp;
  } {
    const notificationTimestamp = notificationsSnapshot.get(
      'time'
    ) as Timestamp;
    const notificationTime = notificationTimestamp.toDate();
    let late = false;
    let lateTime: Date | Timestamp = new Date();
    if (notificationTime > new Date()) {
      // the current date is before the current notification time, so we use the previous time.
      const prevTime = (
        notificationsSnapshot.get('prevTime') as Timestamp
      ).toDate();
      const difference = new Date().getTime() - prevTime.getTime(); // This will give difference in milliseconds
      const resultInMinutes = Math.round(difference / (60 * 1000));
      if (resultInMinutes > 5) {
        late = true;
        lateTime = new Date(new Date().getTime() - prevTime.getTime());
      }
    } else {
      // the current date is after the current notification time
      const difference = new Date().getTime() - notificationTime.getTime(); // This will give difference in milliseconds
      const resultInMinutes = Math.round(difference / (60 * 1000));
      if (resultInMinutes > 5) {
        late = true;
        lateTime = new Date(new Date().getTime() - notificationTime.getTime());
      }
    }

    // create and store the submission
    let time = Timestamp.fromDate(new Date());
    lateTime = Timestamp.fromDate(lateTime);
    return { late, time, lateTime };
  }
}
