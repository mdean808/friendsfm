import { onRequest } from 'firebase-functions/v2/https';
import { emptyMiddleware, sentryWrapper } from '../middleware';
import User from '@/classes/user';
import { MusicPlatform } from '@/types';

export const getusercurrentlylistening = onRequest(
  { cors: true },
  emptyMiddleware(
    sentryWrapper('get-user-currently-listening', async (req, res) => {
      const { id, username } = JSON.parse(req.body);
      let user;
      if (id) user = new User(id);
      else user = await User.getByUsername(username);
      await user.load();
      if (user.musicPlatform === MusicPlatform.appleMusic) {
        res.status(200).type('json').send({ type: 'success', message: null });
      } else {
        try {
          await user.updateSpotifyAuth();
          let song = await user.getRecentSpotifySong();
          // check if it's a current song
          if (song.timestamp) {
            res
              .status(200)
              .type('json')
              .send({ type: 'success', message: null });
          } else {
            res
              .status(200)
              .type('json')
              .send({ type: 'success', message: song });
          }
        } catch (e) {
          console.log('get-user-currently-listening error: ', e);
          res.status(200).type('json').send({ type: 'success', message: null });
        }
      }
    })
  )
);
