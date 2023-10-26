import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

export class SpotifyApi {
  private client_id: string;
  private client_secret: string;
  public access_token = '';

  constructor(client_id: string, client_secret: string) {
    this.client_id = client_id;
    this.client_secret = client_secret;
  }

  public async getAccessToken(): Promise<string> {
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

    fetch('https://accounts.spotify.com/api/token', options)
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        } else {
          throw new Error('Error: ' + response.status);
        }
      })
      .then(async (body) => {
        const access_token = body.access_token;
        const expires_at = new Date();
        const doc = db.collection('misc').doc('spotify');
        doc.set({ access_token, expires_at });
      })
      .catch((error) => console.error(error));

    return '';
  }

  public async isAccessTokenExpired(): Promise<boolean> {
    const expires_at = new Date(
      (await db.collection('misc').doc('spotify').get()).get('expires_at')
    );
    return new Date() > expires_at;
  }
}
