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
      if (id) {
        user = new User(id);
        await user.load();
      } else {
        user = await User.getByUsername(username);
      }
      if (user.musicPlatform === MusicPlatform.appleMusic) {
        res.status(200).type('json').send({ type: 'success', message: null });
      } else {
        try {
          const song = await user.getCurrentlyListening();
          // check if it's a current song
          if (song) {
            res
              .status(200)
              .type('json')
              .send({ type: 'success', message: song });
          } else {
            res
              .status(200)
              .type('json')
              .send({ type: 'success', message: null });
          }
        } catch (e) {
          console.log('get-user-currently-listening error: ', e);
          res.status(200).type('json').send({ type: 'success', message: null });
        }
      }
    })
  )
);
