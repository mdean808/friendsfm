"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.generateNotificationTime = exports.sendNotification = void 0;
const functions = require("firebase-functions");
const auth_1 = require("firebase-admin/auth");
const firebase_auth_1 = require("../firebase-auth");
const app_1 = require("firebase-admin/app");
(0, app_1.initializeApp)({
    credential: (0, app_1.cert)(firebase_auth_1.default),
    databaseURL: 'https://friendsfm-default-rtdb.firebaseio.com',
});
const auth = (0, auth_1.getAuth)();
const notifications_1 = require("./lib/notifications");
const tasks_1 = require("./lib/tasks");
const db_1 = require("./lib/db");
exports.sendNotification = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    const data = req.body;
    if (!req.body) {
        res.status(400).end();
        return;
    }
    const secret = data.split('__')[1];
    if (secret === process.env.SECRET) {
        functions.logger.info('Sending Daily Notifications!');
        await (0, notifications_1.sendDaily)();
        res.status(200).type('json').send({
            type: 'success',
            message: 'Daily notification sent.',
        });
    }
    else {
        functions.logger.info('Secret was incorrect: ' + secret + '\nNo notifications sent.');
        res
            .status(401)
            .type('json')
            .send({ type: 'error', message: 'Incorrect secret provided.' });
    }
});
exports.generateNotificationTime = functions.pubsub
    .schedule('0 0 * * *')
    .onRun(tasks_1.createNotificationTask);
exports.loginUser = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    const user = JSON.parse(req.body);
    //TODO: move this to other functions for new users
    // if (!user.username || !user.musicPlatform) {
    //   res
    //     .status(400)
    //     .type('json')
    //     .send({
    //       type: 'error',
    //       message: `Missing ${user.username ? '' : 'username'} or ${
    //         user.musicPlatform ? '' : 'preferred platform'
    //       }.`,
    //     });
    //   return;
    // }
    try {
        // verify the auth token with firebase's backend
        const decodedTokenData = await auth.verifyIdToken(user.authToken);
        user.id = decodedTokenData.uid;
        const userRes = await (0, db_1.getUserByUid)(user.id);
        if (userRes) {
            // user has already been registered, send success
            functions.logger.info(`User ${userRes.id} already registered`);
            res.status(200).type('json').send({ type: 'success', message: userRes });
        }
        else {
            try {
                const userRes = await (0, db_1.createUser)(user);
                //store user to the database and return id
                res
                    .status(200)
                    .type('json')
                    .send({ type: 'success', message: userRes });
            }
            catch (e) {
                functions.logger.error(e);
                // error with creating the user
                res.status(400).type('json').send({ type: 'error', message: e });
                return;
            }
        }
    }
    catch (e) {
        // firebase authnetication error
        functions.logger.error(e);
        res
            .status(400)
            .type('json')
            .send({ type: 'error', message: 'Authentication Failed.' });
    }
});
//# sourceMappingURL=index.js.map