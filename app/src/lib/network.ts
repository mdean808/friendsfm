import {
  ResponseType,
  type NetworkRequest,
  type NetworkResponse,
} from '$lib/types';
import { spotifyAuthCode } from './user';
import ky from 'ky';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { errorToast } from '$lib/util';
import { Dialog } from '@capacitor/dialog';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { endSession, session } from './session';
import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { authenticateWithSpotify } from './spotify';

export default class Network {
  requests: NetworkRequest[] = [];

  private spotifySet = false;

  constructor() {}

  public add(request: NetworkRequest) {
    this.requests.push(request);
    return request;
  }

  public update(id: number, data: NetworkRequest) {
    const req = this.requests.find((r) => r.id === id);
    if (req) {
      for (let key of Object.keys(data)) {
        req[key] = data[key];
      }
    }
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

  public async queryFirebase(
    endpoint: string,
    body: object = {},
    attempts: number = 0
  ) {
    // generate url
    const url = this.firebaseUrl(endpoint);
    // don't attempt again if we'ves already tried 2+ times.
    if (attempts >= 2) return;
    // register with analytics
    FirebaseAnalytics.logEvent({ name: 'request', params: { url } });
    // generate request object
    const id = Math.floor(Math.random() * 1000);
    const networkRequest = this.add({
      id,
      url: endpoint,
      abortController: new AbortController(),
      body,
      attempts: attempts || 0,
    });
    // make request
    let res = {} as Response;
    try {
      res = await ky.post(url, {
        headers: {
          Authentication:
            'Bearer ' + (await FirebaseAuthentication.getIdToken()).token,
        },
        body: JSON.stringify(body),
      });
    } catch (e: any) {
      if (e.message.includes('No user is signed in.')) {
        await endSession();
        return goto('/intro/login');
      }
      res = e.response;
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
    if (!res) {
      // response failed, retry.
      console.log('no network response received. retrying');
      if (!networkRequest.attempts) networkRequest.attempts = 0;
      networkRequest.attempts++;
      this.queryFirebase(
        networkRequest.url,
        networkRequest.body,
        networkRequest.attempts
      );
      return false;
    }
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
        if (!get(session).loggedIn) break; // user not logged in
        switch (res.status) {
          case 400:
            errorToast({ content: json.message });
            break;
          case 401:
            errorToast({
              content: 'Authentication Error. Please sign in again.',
            });
            goto('/intro/login');
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
            break;
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
      json.error?.includes('Firebase ID token has been revoked') ||
      json.error === 'client_auth_error'
    ) {
      await endSession();
      goto('/intro/login');
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
        await authenticateWithSpotify();
        spotifyAuthCode.subscribe(() => {
          if (!this.spotifySet) {
            this.spotifySet = true;
          }
        });
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
