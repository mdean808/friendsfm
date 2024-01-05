import { AppleMusicApi } from '@/classes/AppleMusicApi';
import { SentryTransaction } from '@/classes/SentryTransaction';
import { CustomError } from '@/classes/error';
import { MusicKitSearchResponse } from '@/types';

type SearchTypes = ('artist' | 'track' | 'playlist' | 'album')[];

export const searchAppleMusic = async (
  query: string,
  types: SearchTypes
): Promise<MusicKitSearchResponse> => {
  const transaction = new SentryTransaction(
    'apple-music-search',
    'searchAppleMusic',
    { query, types }
  );
  types = types.map((t) => t.replace(/track/g, 'song')) as SearchTypes;
  const pluralTypes = types.map((t) => t + 's');
  const musicKit = new AppleMusicApi();
  await musicKit.getToken();
  const url = `https://api.music.apple.com/v1/catalog/us/search?types=${encodeURIComponent(
    pluralTypes.toString()
  )}&term=${query}&limit=20`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${musicKit.token}`,
    },
  });
  transaction.setTag('status', res.status);
  transaction.finish();
  if (res.status < 400) {
    return await res.json();
  } else {
    throw new CustomError(
      `Apple Music Search Failed: ${res.status} ${
        res.statusText
      }. query: ${query}, types: ${types.toString()}`
    );
  }
};
