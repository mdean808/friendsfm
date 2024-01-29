import { MusicPlatform, ResponseType, type NetworkResponse } from '../types';
import {
  activeRequests,
  getNewAuthToken,
  logout,
  platform,
  spotifyAuthCode,
  updateMusicPlatform,
} from '../store';
import {
  FirebaseAnalytics,
  type LogEventOptions,
} from '@capacitor-firebase/analytics';
import { Dialog } from '@capacitor/dialog';
import { errorToast, goto } from './util';
import SentryTransaction from './SentryTransaction';

let spotifySet: boolean;
export const handleApiResponse = async (res: Response) => {
  const activeRequest = activeRequests.get().get(res.url);
  let eventParams: LogEventOptions['params'] = {};
  eventParams.status = res.status;
  eventParams.statusText = res.statusText;
  if (res.status >= 500) {
    errorToast('Error ' + res.status + ': ' + res.statusText);
    FirebaseAnalytics.logEvent({
      name: 'response',
      params: eventParams,
    });
    return;
  }
  const json = (await res.json()) as NetworkResponse;
  if (res.status !== 200 && !json) {
    errorToast('Error ' + res.status + ': ' + res.statusText);
    FirebaseAnalytics.logEvent({
      name: 'response',
      params: eventParams,
    });
    return false;
  } else if (json.type === ResponseType.error) {
    console.log('ERROR:', json, res.url);
    eventParams.message = json.message;
    eventParams.error = json.error;
    if (json.message === 'User does not exist.') {
      logout();
      goto('/new_user');
    } else if (
      json.message === 'Authentication Failed.' ||
      json.message.includes('Missing Authentication Token')
    ) {
      await getNewAuthToken();
    } else if (
      json.message.includes('Spotify 403 Forbidden') ||
      json.message.includes('Spotify now playing error. 401') ||
      json.message.includes('Spotify token refresh error')
    ) {
      const { value } = await Dialog.confirm({
        title: 'Spotify® Authentication',
        message:
          'You need to re-authenticate with Spotify® to proceed. Continue?',
      });
      if (value) {
        spotifySet = false;
        spotifyAuthCode.listen(async (value: string) => {
          if (!spotifySet) {
            await updateMusicPlatform(MusicPlatform.spotify, value);
            spotifySet = true;
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
    } else {
      errorToast('Error: ' + json.message || json.error || 'Unknown Error.');
    }
    FirebaseAnalytics.logEvent({
      name: 'response',
      params: eventParams,
    });
    if (activeRequest) {
      activeRequest.transaction.setTag('status', eventParams.status);
      activeRequest.transaction.setTag('statusText', eventParams.status);
      activeRequest.transaction.span.data = eventParams;
      activeRequest.transaction.finish();
      activeRequests.get().remove(activeRequest);
    }
    return false;
  }

  FirebaseAnalytics.logEvent({
    name: 'response',
    params: eventParams,
  });
  if (activeRequest) {
    activeRequest.transaction.setTag('status', eventParams.status);
    activeRequest.transaction.setTag('statusText', eventParams.status);
    activeRequest.transaction.span.data = eventParams;
    activeRequest.transaction.finish();
    activeRequests.get().remove(activeRequest);
  }
  return json;
};

export const getFirebaseUrl = (endpoint: string) => {
  let url = '';
  if (import.meta.env.DEV) {
    url = `http://127.0.0.1:5001/friendsfm/us-central1/${endpoint}`;
  } else {
    url = `https://${endpoint}-tprlxlzyxq-uc.a.run.app`;
  }
  FirebaseAnalytics.logEvent({ name: 'request', params: { url } });
  const transaction = new SentryTransaction('fetch-' + endpoint, endpoint);
  activeRequests.get().add({ url, transaction });
  return url;
};
