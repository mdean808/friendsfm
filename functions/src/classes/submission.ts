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

const db = getFirestore();

export default class Submission {
  id: string;
  number: number;
  late: boolean;
  song: Song;
  time: Date | Timestamp;
  audial: Audial;
  user: {
    username: string;
    musicPlatform: MusicPlatform;
    id: string;
  };
  location: Location;
  lateTime: Date | Timestamp;
  comments: Comment[];
  userId: string;

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
    };
  }

  public async setAudial(audial: Audial) {
    if (!audial || !audial.score || !audial.number)
      throw new Error('Invalid audial provided');
    await this.dbRef.update({ audial });
  }

  public async addComment(content: string, user: User): Promise<Comment> {
    if (!content) throw new Error('No comment content provided');
    const id = randomUUID();
    const comment = {
      id,
      content,
      user: { id: user.id, username: user.username },
    };
    await this.dbRef.update({
      comments: FieldValue.arrayUnion(comment),
    });
    const u = new User(this.userId);
    if (this.userId !== user.id)
      u.load().then(() =>
        u.sendNotification(`friendsfm comment`, `${user.username}: ${content}`)
      );
    return comment;
  }

  public async removeComment(comment: Comment) {
    if (!comment) throw new Error('No comment provided');
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
      if (resultInMinutes > 2) {
        late = true;
        lateTime = new Date(new Date().getTime() - prevTime.getTime());
      }
    } else {
      // the current date is after the current notification time
      const difference = new Date().getTime() - notificationTime.getTime(); // This will give difference in milliseconds
      const resultInMinutes = Math.round(difference / (60 * 1000));
      if (resultInMinutes > 2) {
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
