# FriendsFM Monorepo
This is the mono repo for FriendFM, a way to share what you're listening to with your friends.
## Links
[FriendsFM](https://friendsfm.app)

[iOS](https://apps.apple.com/us/app/friendsfm/id6445926913) | [Android](https://play.google.com/store/apps/details?id=xyz.mogdan.friendsfm) | [Web App](https://app.friendsfm.app/)

## Structure
* 📁 `app` - Mobile app written using Capacitor and Svelte
* 📁 `functions` - Serverless backend using Firebase Functions, Firestore, and so on.
* 📁 `web` - Web page written using SvelteKit, hosted on Firebase.

## Development
* Run `yarn install` in each folder to install dependencies
* Run `yarn app:deploy` to deploy the web app.
* Run `yarn functions:deploy` to deploy the serverless functions.
* Run `yarn web:deploy` to deploy the website.
* Run `yarn deploy` to deploy all firebase projects (website, web app, functions).
* `app`
  * `yarn dev` for local development. (Requires an active firebase emulator instance running in `functions`)
  * `yarn build` to build for production.
  * `yarn ios:build` to build for iOS.
  * `yarn android:build` to build for Android.
  * `yarn release` to build and upload Sentry artifacts for both iOS and Android.
* `functions`
  * `yarn serve` to start the firebase emulator for local development.
  * `yarn deploy` to deploy the functions to firebase.
* `web`
  * `yarn dev` for local development.
  * `yarn build` to build for production.
