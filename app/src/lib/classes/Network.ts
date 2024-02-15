import {
  MusicPlatform,
  ResponseType,
  type NetworkRequest,
  type NetworkResponse,
} from '../../types';
import ky, { HTTPError } from 'ky';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import SentryTransaction from './SentryTransaction';
import { errorToast, goto } from '../util';
import {
  appCheckToken,
  authToken,
  getNewAuthToken,
  logout,
  platform,
  spotifyAuthCode,
  updateMusicPlatform,
} from '../../store';
import { Dialog } from '@capacitor/dialog';

export default class Network {
  requests: NetworkRequest[] = [];

  private spotifySet = false;

  constructor() {}

  public add(request: NetworkRequest) {
    this.requests.push(request);
    return request;
  }

  public update(id: number, data: NetworkRequest): NetworkRequest {
    const req = this.requests.find((r) => r.id === id);
    if (req) {
      for (let key of Object.keys(data)) {
        req[key] = data[key];
      }
    }
    return req;
  }

  public get(id: number) {
    return this.requests.find((r) => r.id === id);
  }

  public getByUrl(url: string) {
    return this.requests.find((r) => r.url === url);
  }

  public remove(request: NetworkRequest) {
    this.requests = this.requests.filter((r) => r.url === request.url);
  }

  public async queryFirebase(endpoint: string, body?: object) {
    // generate url
    const url = this.firebaseUrl(endpoint);
    //TODO: figure out if this breaks things or not
    // check if a request is already running abort in favor of this new request
    const existingRequest = this.getByUrl(url);
    if (existingRequest) {
      existingRequest.abortController.abort();
      this.remove(existingRequest);
    }
    // register with analytics
    FirebaseAnalytics.logEvent({ name: 'request', params: { url } });
    const transaction = new SentryTransaction('fetch-' + endpoint, endpoint);
    // generate request object
    const id = Math.floor(Math.random() * 1000);
    const networkRequest = this.add({
      id,
      url: endpoint,
      transaction,
      abortController: new AbortController(),
    });
    // make request
    let res = {} as Response;
    try {
      res = await ky.post(url, {
        headers: {
          Authentication: 'Bearer ' + authToken.get(),
          'x-firebase-appcheck': appCheckToken.get(),
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      res = (e as HTTPError).response;
    }
    // update request object with response
    this.update(id, { ...networkRequest, response: res });
    // handle response, return the message
    return this.handleApiResponse(res, networkRequest);
  }

  private async handleApiResponse(
    res: Response,
    networkRequest: NetworkRequest
  ): Promise<any> {
    const json: NetworkResponse = await res.json();

    switch (Math.floor(res.status / 100)) {
      case 2: // 2xx - success
        if (json?.type === ResponseType.error) {
          errorToast({ content: `Error: ${json.error}` });
        }
        //    console.log(
        //      `${res.status} Success. \nError: ${json?.error}\nStatus Text: ${res.statusText}`
        //   );
        break;
      case 3: // 3xx - redirection
        console.log(
          `${res.status} Redirection: ${json?.message}\nError: ${json?.error}\nStatus Text: ${res.statusText}`
        );
        break;
      case 4: // 4xx - client error
        switch (res.status) {
          case 401:
            errorToast({
              content: 'Authentication Error. Please sign in again.',
            });
            break;
          case 403:
            errorToast({
              content: 'Forbidden. You do not have access to this resource.',
            });
            break;
          case 404:
            errorToast({
              content: 'Not found. The requested item does not exist.',
            });
          default:
            errorToast({
              content:
                'Application Error. Please try again, or contact the developers for support.',
            });
            break;
        }
        console.log(
          `${res.status} Client Error: ${json?.message}\nError: ${json?.error}\nStatus Text: ${res.statusText}`
        );
        break;
      case 5: // 5xx - server error
        errorToast({
          content:
            'Something went wrong. Please try again, or contact the developers for support.',
        });
        console.log(
          `${res.status} Server Error: ${json?.message}\nError: ${json?.error}\nStatus Text: ${res.statusText}`
        );
        break;
      default: // unknown code
        break;
    }
    // handle specific error messages
    await this.messageSpecificHandling(json);

    // update analytics
    FirebaseAnalytics.logEvent({
      name: 'response',
      params: {
        status: res.status,
        statusText: res.statusText,
        error: json.error,
      },
    });
    networkRequest.transaction.setTag('status', res.status);
    networkRequest.transaction.setTag('statusText', res.status);
    networkRequest.transaction.span.data = {
      status: res.status,
      statusText: res.statusText,
      message: json.message,
      error: json.error,
    };
    networkRequest.transaction.finish();

    // network reequest handled
    this.remove(networkRequest);

    // return false if we have an error
    return json.type === ResponseType.success ? json?.message : false;
  }

  private async messageSpecificHandling(json: NetworkResponse) {
    if (!json || !json.message || typeof json.message != 'string') return;
    // handle Authentication errors
    if (
      json.message === 'User does not exist.' ||
      json.error?.includes('Firebase ID token has been revoked')
    ) {
      logout();
      goto('/new_user');
    } else if (
      json.message === 'Authentication Failed.' ||
      json.message.includes('Missing Authentication Token')
    ) {
      await getNewAuthToken();
    }
    // handle spotify errors
    if (
      json.message.includes('Spotify 403 Forbidden') ||
      json.message.includes('Spotify now playing error.') ||
      json.message.includes('Spotify token refresh error')
    ) {
      const { value } = await Dialog.confirm({
        title: 'Spotify® Authentication',
        message:
          'You need to re-authenticate with Spotify® to proceed. Continue?',
      });
      if (value) {
        this.spotifySet = false;
        spotifyAuthCode.listen(async (value: string) => {
          if (!this.spotifySet) {
            await updateMusicPlatform(MusicPlatform.spotify, value);
            this.spotifySet = true;
          }
        });
        const spotifyUrl = `https://accounts.spotify.com/authorize?client_id=${
          import.meta.env.VITE_SPOTIFY_CLIENT_ID
        }&response_type=code&redirect_uri=${
          platform.get() === 'web'
            ? import.meta.env.VITE_SPOTIFY_REDIRECT_URL_WEB
            : import.meta.env.VITE_SPOTIFY_REDIRECT_URL
        }&scope=user-read-currently-playing%20user-read-recently-played%20playlist-modify-private%20playlist-modify-public`;
        window.location.href = spotifyUrl;
      }
    }
  }

  private firebaseUrl(endpoint: string): string {
    if (import.meta.env.DEV) {
      return `http://127.0.0.1:5001/friendsfm/us-central1/${endpoint}`;
    } else {
      return `https://${endpoint}-tprlxlzyxq-uc.a.run.app`;
    }
  }
}
