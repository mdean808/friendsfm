import { searchAppleMusic } from '@/lib/music-kit';
import { onRequest } from 'firebase-functions/v2/https';

export const search = onRequest({ cors: true }, async (req, res) => {
  const results = await searchAppleMusic(req.body.query);
  res.status(200).type('json').send({ type: 'success', message: results });
});
