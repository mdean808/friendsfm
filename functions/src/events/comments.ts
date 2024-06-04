import User from '@/classes/user';
import { Comment, Submission } from '@/types';
import { firestore } from 'firebase-functions/v2';

const getNewComment = (
  newComments: Comment[],
  oldComments: Comment[]
): Comment | null => {
  // Create a Set from arr2 for efficient lookup
  const arr2Set = new Set(
    oldComments.map((comment) => JSON.stringify(comment))
  );

  // Find the comment in arr1 that is not present in arr2Set
  const missingComment = newComments.find(
    (comment) => !arr2Set.has(JSON.stringify(comment))
  );

  return missingComment || null;
};

export const notifyoncomment = firestore.onDocumentUpdated(
  'submissions/{subId}',
  async (ctx) => {
    const oldSub = { ...ctx.data?.before.data(), id: ctx.data?.before.id } as Submission;
    const newSub = { ...ctx.data?.after.data(), id: ctx.data?.after.id } as Submission;
    if (newSub.comments.length > oldSub.comments.length) {
      const comment = getNewComment(newSub.comments, oldSub.comments);
      if (!comment) return;
      const notifsSentToUsernames: string[] = [];
      // send notification to the current submission user
      const subUser = new User(newSub.userId);
      if (subUser.id !== comment.user.id) {
        await subUser.load();
        notifsSentToUsernames.push(subUser.public.username || subUser.id);
        subUser.sendNotification(
          `${comment.user.username} commented`,
          comment.content,
          {
            type: 'comment',
            id: newSub.id,
          }
        );
      }
      // send notification to anyone else who commented
      // filter comments so we just get one from each commenter
      for (const c of Object.values(
        newSub.comments.reduce(
          (acc, com) => ({ ...acc, [com.user.id]: com }),
          {} as Comment
        )
      )) {
        // make sure the comment exists
        if (!c) continue;
        const u = new User(c.user.id);
        // IF the comment is not the submission user AND the commenter has not made a comment previously
        if (subUser.id !== u.id && u.id !== comment.user.id) {
          const u = new User(c.user.id);
          await u.load();
          notifsSentToUsernames.push(u.public.username || subUser.id);
          u.sendNotification(
            `${comment.user.username} commented`,
            comment.content,
            {
              type: 'comment',
              id: newSub.id,
            }
          );
        }
      }
      // grab usernames in the comment
      const usernamesInContent = comment.content
        .split(' ')
        .filter((word) => word.startsWith('@'))
        .map((word) => word.slice(1));

      // make sure we don't send duplicate notifications
      const uniqueUsernames = [
        ...new Set(
          usernamesInContent
            .filter((x) => !notifsSentToUsernames.includes(x))
            .concat(
              notifsSentToUsernames.filter(
                (x) => !usernamesInContent.includes(x)
              )
            )
        ),
      ];

      // send notification to anyone who was mentioned
      for (const username of uniqueUsernames) {
        if (notifsSentToUsernames.find((u) => u === username)) continue;
        User.getByUsername(username).then((u) => {
          u.sendNotification(
            `${comment.user.username} mentioned you in a comment`,
            comment.content,
            {
              type: 'comment',
              id: newSub.id,
            }
          );
        });
        notifsSentToUsernames.push(username);
      }
    }
  }
);
