import { CustomError } from './error';
import { ItemTypes, SpotifyApi as Spotify } from '@spotify/web-api-ts-sdk';

export class SpotifyServerApi {
  private client_id: string;
  private client_secret: string;
  private sdk: Spotify;

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
    this.sdk = Spotify.withClientCredentials(
      this.client_id,
      this.client_secret
    );
  }

  public async search(query: string, types: ItemTypes[]) {
    return await this.sdk.search(query, types);
  }

  public async getSong(name: string, artist: string) {
    return await this.sdk.search(
      `track:${name} artist:${artist}`,
      ['track'],
      undefined,
      1
    );
  }
}
