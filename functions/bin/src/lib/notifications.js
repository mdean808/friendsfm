"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToMorgan = exports.sendDaily = void 0;
const messaging_1 = require("firebase-admin/messaging");
const messaging = (0, messaging_1.getMessaging)();
const sendDaily = async () => {
    const topic = 'all';
    const message = {
        notification: {
            title: 'FriendsFM',
            body: 'See what your friends are currently listening to!',
        },
        topic: topic,
    };
    // Send a message to devices subscribed to the provided topic.
    const res = await messaging.send(message);
    console.log('Successfully sent message:', res);
};
exports.sendDaily = sendDaily;
const sendToMorgan = async (date) => {
    const message = {
        notification: {
            title: 'New Notification Time Generated',
            body: date.toLocaleTimeString(),
        },
        token: process.env.MORGAN_TOKEN || '',
    };
    const res = await messaging.send(message);
    console.log('Sent message to morgan', res);
};
exports.sendToMorgan = sendToMorgan;
//# sourceMappingURL=notifications.js.map