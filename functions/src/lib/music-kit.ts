import { AppleMusicApi } from '@/classes/AppleMusicApi';
import { MusicKitSearchResponse } from '@/types';

type SearchTypes = ('artist' | 'track' | 'playlist' | 'album')[];

export const searchAppleMusic = async (
  query: string,
  types: SearchTypes
): Promise<MusicKitSearchResponse> => {
  types = types.map((t) => t.replace(/track/g, 'song')) as SearchTypes;
  const pluralTypes = types.map((t) => t + 's');
  const musicKit = new AppleMusicApi();
  await musicKit.getToken();
  const url = `https://api.music.apple.com/v1/catalog/us/search?types=${encodeURIComponent(
    pluralTypes.toString()
  )}&term=${encodeURIComponent(query)}&limit=20`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${musicKit.token}`,
    },
  });
  if (res.status < 400) {
    return await res.json();
  } else {
    throw new Error(
      `Apple Music Search Failed: ${res.status} ${
        res.statusText
      }. query: ${query}, types: ${types.toString()}`
    );
  }
};
