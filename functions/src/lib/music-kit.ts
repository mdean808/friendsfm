import { AppleMusicApi } from '@/classes/AppleMusicApi';
import { MusicKitSearchResponse } from '@/types';

export const searchAppleMusic = async (
  query: string
): Promise<MusicKitSearchResponse> => {
  const musicKit = new AppleMusicApi();
  await musicKit.getToken();
  const url = `https://api.music.apple.com/v1/catalog/us/search?types=songs&term=${query}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${musicKit.token}`,
    },
  });
  return res.json();
};
