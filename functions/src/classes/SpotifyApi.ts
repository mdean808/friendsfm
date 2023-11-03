import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { CustomError } from './error';

const db = getFirestore();

export class SpotifyApi {
  private client_id: string;
  private client_secret: string;
  public access_token = '';

  constructor(
    client_id: string | undefined,
    client_secret: string | undefined
  ) {
    if (!client_id)
      throw new CustomError('No Spotify client ID passed to constructor.');
    if (!client_secret)
      throw new CustomError('No Spotify client ID passed to constructor.');
    this.client_id = client_id;
    this.client_secret = client_secret;
  }

  public async refreshAccessToken() {
    const options = {
      method: 'POST',
      headers: {
        Authorization:
          'Basic ' +
          Buffer.from(this.client_id + ':' + this.client_secret).toString(
            'base64'
          ),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    };

    const res = await fetch('https://accounts.spotify.com/api/token', options);
    if (res.status === 200) {
      const body = await res.json();
      this.access_token = body.access_token;
      const expires_at = new Date();
      const doc = db.collection('misc').doc('spotify');
      doc.update({
        access_token: this.access_token,
        expires_at: Timestamp.fromDate(expires_at),
      });
    } else {
      throw new Error('Error: ' + res.status);
    }
  }

  public async getAccessToken(): Promise<string> {
    const doc = await db.collection('misc').doc('spotify').get();
    const access_token = doc.get('access_token');
    const expires_at = doc.get('expires_at') as Timestamp;
    this.access_token = access_token;
    if (new Date() > (expires_at?.toDate() || 0)) {
      await this.refreshAccessToken();
    }
    return this.access_token;
  }

  public async isAccessTokenExpired(): Promise<boolean> {
    const expires_at = (await db.collection('misc').doc('spotify').get()).get(
      'expires_at'
    ) as Timestamp;
    return new Date() > (expires_at?.toDate() || 0);
  }
}
