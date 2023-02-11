"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationTask = void 0;
const functions = require("firebase-functions");
const tasks_1 = require("@google-cloud/tasks");
const notifications_1 = require("./notifications");
const client = new tasks_1.CloudTasksClient();
const createNotificationTask = async () => {
    const project = "friendsfm";
    const queue = "notification-time";
    const location = "us-west1";
    const url = "https://us-central1-friendsfm.cloudfunctions.net/sendNotification";
    const notificationTime = getRandomDate(new Date(new Date().getTime() + 6 * 60 * 60 * 1000), new Date(new Date().getTime() + 21 * 60 * 60 * 1000));
    const payload = notificationTime.toString();
    // calculate seconds until the random time
    const inSeconds = (notificationTime.getTime() - new Date().getTime()) / 1000;
    // Construct the fully qualified queue name.
    const parent = client.queuePath(project, location, queue);
    const task = {
        httpRequest: {
            headers: {
                "Content-Type": "text/plain",
            },
            body: "",
            httpMethod: "POST",
            url,
        },
        scheduleTime: {
            seconds: inSeconds + Date.now() / 1000,
        },
    };
    if (payload)
        task.httpRequest.body = Buffer.from(payload + "__" + process.env.SECRET).toString("base64");
    // Send create task request.
    const request = { parent: parent, task: task };
    await client.createTask(request);
    functions.logger.info("Task Created");
    await (0, notifications_1.sendToMorgan)(notificationTime);
};
exports.createNotificationTask = createNotificationTask;
const getRandomDate = (from, to) => {
    const fromTime = from.getTime();
    const toTime = to.getTime();
    return new Date(fromTime + Math.random() * (toTime - fromTime));
};
//# sourceMappingURL=tasks.js.map