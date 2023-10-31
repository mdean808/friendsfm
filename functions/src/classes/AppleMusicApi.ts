import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import AppleAuth from '@/apple-auth';
import { sign } from 'jsonwebtoken';
import { CustomError } from './error';

const db = getFirestore();
export class AppleMusicApi {
  public token: string;
  constructor() {
    this.token = '';
  }

  public async generateNewToken() {
    let tokenRes = '';
    const privateKey = AppleAuth.musicKitPrivateKey;

    const now = Math.floor(Date.now() / 1000);
    const alg = 'ES256';
    const headers = {
      alg: alg,
      kid: process.env.APPLE_MUSIC_KIT_ID,
    };
    // Exp is set to now + 6 months
    const payload = {
      iss: process.env.APPLE_TEAM_ID,
      exp: now + 15777000,
      iat: now,
    };

    sign(payload, privateKey, { header: headers }, async (e, token) => {
      if (e) {
        console.error(e);
        process.exit(1);
      }
      tokenRes = token || '';
      this.token = tokenRes;
      if (await this.testToken()) {
        // token failed
        throw new CustomError('Apple Music Token Generation FAILED');
      }
    });
    return tokenRes;
  }

  public async testToken(): Promise<boolean> {
    const res = await fetch('https://api.music.apple.com/v1/test', {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
    if (res.status == 401) {
      return false;
    } else if (res.status == 429) {
      return false;
    }
    return true;
  }

  public async isTokenExpired() {
    const expires_at = (await db.collection('misc').doc('spotify').get()).get(
      'expires_at'
    ) as Timestamp;
    return new Date() > expires_at.toDate();
  }

  public async getToken() {
    const doc = await db.collection('misc').doc('spotify').get();
    const token = doc.get('access_token');
    const expires_at = doc.get('expires_at') as Timestamp;
    this.token = token;
    if (new Date() > expires_at.toDate()) {
      await this.generateNewToken();
    }
    return this.token;
  }
}
