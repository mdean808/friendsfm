import {
  DocumentReference,
  DocumentSnapshot,
  getFirestore,
  Timestamp,
} from 'firebase-admin/firestore';
import {
  Audial,
  MusicPlatform,
  Song,
  Submission as SubmissionType,
} from '../types';
import User from './user';

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
  location: {
    longitude: number;
    latitude: number;
  };
  lateTime: Date | Timestamp;

  constructor(
    id: string,
    number: number,
    song: Song,
    audial: Audial,
    location: { longitude: number; latitude: number },
    late: boolean,
    time: Date | Timestamp,
    lateTime: Date | Timestamp,
    user: User
  ) {
    this.id = id;
    this.number = number;
    this.song = song;
    this.audial = audial;
    this.location = location;
    this.late = late;
    this.time = time;
    this.lateTime = lateTime;
    this.user = {
      id: user.id,
      username: user.username || '',
      musicPlatform: user.musicPlatform || MusicPlatform.spotify,
    };
  }

  public async load(): Promise<Submission> {
    const res = await this.dbRef.get();
    for (const key in this) {
      this[key] = res.get(key.toString()) || this[key];
    }
    return this;
  }

  public formatDatesForFrontend() {
    this.time = (this.time as Timestamp).toDate();
    this.lateTime = (this.lateTime as Timestamp).toDate();
  }
  public formatDatesForFirebase() {
    this.time = Timestamp.fromDate(this.time as Date);
    this.lateTime = Timestamp.fromDate(this.lateTime as Date);
  }

  public get dbRef(): DocumentReference {
    return db
      .collection('users')
      .doc(this.user.id)
      .collection('submissions')
      .doc(this.id);
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
      user: this.user,
    };
  }

  public static async getCurrentCount() {
    return (await db.collection('misc').doc('notifications').get()).get(
      'count'
    );
  }

  public async setAudial(audial: Audial) {
    if (!audial || !audial.score || !audial.number)
      throw new Error('Invalid audial provided');
    await this.dbRef.update({ audial });
  }

  public static async canCreate(
    userRef: DocumentReference,
    notificationsSnapshot: DocumentSnapshot
  ): Promise<boolean> {
    const currentSubmissionCount = notificationsSnapshot.get('count');
    const submissionsRef = userRef.collection('submissions');
    const existingSubmission = await submissionsRef
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
