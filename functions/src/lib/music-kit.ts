import { AppleMusicApi } from '@/classes/AppleMusicApi';
import { CustomError } from '@/classes/error';
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
  if (res.status < 400) {
    return await res.json();
  } else {
    throw new CustomError('Apple Music Search Failed.');
  }
};
