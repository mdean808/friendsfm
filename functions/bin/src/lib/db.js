"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSong = exports.createAudial = exports.createSubmission = exports.createUser = exports.getUserByUid = void 0;
const firestore_1 = require("firebase-admin/firestore");
const crypto_1 = require("crypto");
const db = (0, firestore_1.getFirestore)();
const getUserByUid = async (uid) => {
    const usersRef = db.collection('users');
    const res = await usersRef.doc(uid).get();
    return res.data();
};
exports.getUserByUid = getUserByUid;
const createUser = async (user) => {
    // check if the email. username already exists
    const usersRef = db.collection('users');
    if ((await usersRef.where('email', '==', user.email).get()).docs[0]) {
        throw Error(`Email '${user.email}' already registered.`);
    }
    if ((await usersRef.doc(user.id).get()).exists) {
        console.log('uid taken', user.id, (await usersRef.doc(user.id).get()).exists);
        throw Error('User ID taken. (Perhaps the user has already registered.)');
    }
    const newUserRef = db.collection('users').doc(user.id);
    user.friends = [];
    user.savedSongs = [];
    user.submissions = [];
    user.audials = [];
    await newUserRef.set(user);
    console.log('User inserted into database:', user.id);
    return user;
};
exports.createUser = createUser;
const createSubmission = async (submission) => {
    submission.time = firestore_1.Timestamp.fromDate(submission.time);
    const id = (0, crypto_1.randomUUID)();
    const newSubmissionRef = db.collection('submissions').doc(id);
    await newSubmissionRef.set(submission);
    console.log('Submission inserted into database:', id);
    return id;
};
exports.createSubmission = createSubmission;
const createAudial = async (audial) => {
    const id = (0, crypto_1.randomUUID)();
    const newAudialRef = db.collection('audials').doc(id);
    await newAudialRef.set(audial);
    console.log('Audial inserted into database:', id);
    return id;
};
exports.createAudial = createAudial;
const createSong = async (song) => {
    const id = (0, crypto_1.randomUUID)();
    const newAudialRef = db.collection('audials').doc(id);
    await newAudialRef.set(song);
    console.log('Song inserted into database:', id);
    return id;
};
exports.createSong = createSong;
//# sourceMappingURL=db.js.map