<script lang="ts">
  import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
  import { errorToast, goto } from '../lib/util';
  import {
    appLoading,
    authToken,
    getNewAuthToken,
    loading,
    loginState,
    loginUser,
    platform,
    updateUser,
    user,
  } from '../store';
  import Icon from '../assets/icon.png';
  import { onMount } from 'svelte';
  import { captureException } from '@sentry/capacitor';
  import { UserState } from '../types';
  import { writable } from 'svelte/store';
  import { Dialog } from '@capacitor/dialog';

  const authTaps = writable(0);

  authTaps.subscribe(async (val) => {
    if (val === 3) {
      const email = await Dialog.prompt({
        title: 'Developer Sign-In - Email',
        message: 'Sign-In using a developer email.',
        okButtonTitle: 'Next',
        cancelButtonTitle: 'Cancel',
        inputPlaceholder: 'example@email.com',
      });
      if (!email.cancelled && email.value) {
        const password = await Dialog.prompt({
          title: 'Developer Sign-In - Password',
          message: 'Sign-In using a developer password.',
          okButtonTitle: 'Finish',
          cancelButtonTitle: 'Cancel',
          inputPlaceholder: 'password',
        });
        if (!password.cancelled && password.value) {
          try {
            const res = await FirebaseAuthentication.signInWithEmailAndPassword(
              {
                email: email.value,
                password: password.value,
              }
            );
            await getNewAuthToken();
            if (res.user.email)
              await updateUser({
                ...res.user,
                id: res.user.uid,
                username: undefined,
                friends: [],
                friendRequests: [],
                authToken: $authToken,
              });
            // send login information to the backend
            if (await loginUser()) {
              const u = user.get();
              if (!u) return;
              if (!u.username || u.username === u.id) {
                loginState.set(UserState.registeringUsername);
                goto('/username');
              } else if (!u.musicPlatform) {
                loginState.set(UserState.registeringMusicPlatform);
                goto('/music_provider');
              } else goto('/');
            }
          } catch (e) {
            if (!e.message.includes('closed-by-user')) {
              loading.set(false);
              errorToast('Something went wrong. Please try again.');
              captureException(e);
            }
          }
        }
      }
      authTaps.set(0);
    }
  });

  onMount(async () => {
    // if (!appCheckToken.get()) await getAppCheckToken();
    appLoading.set(false);
    setInterval(() => authTaps.set(0), 10000);
  });

  const signInWithGoogle = async () => {
    loading.set(true);
    try {
      const res = await FirebaseAuthentication.signInWithGoogle();
      await getNewAuthToken();
      if (res.user.email)
        await updateUser({
          ...res.user,
          id: res.user.uid,
          username: undefined,
          friends: [],
          friendRequests: [],
          authToken: authToken.get(),
        });
      // send login information to the backend
      if (await loginUser()) {
        const u = user.get();
        if (!u) return;
        if (!u.username || u.username === u.id) {
          loginState.set(UserState.registeringUsername);
          goto('/username');
        } else if (!u.musicPlatform) {
          loginState.set(UserState.registeringMusicPlatform);
          goto('/music_provider');
        } else goto('/');
      }
    } catch (e) {
      if (!e.message.includes('closed-by-user')) {
        loading.set(false);
        errorToast('Something went wrong. Please try again.');
        captureException(e.message);
      }
    }
    loading.set(false);
  };

  const signInWithApple = async () => {
    loading.set(true);
    try {
      const res = await FirebaseAuthentication.signInWithApple();
      await getNewAuthToken();
      if (res.user.email)
        await updateUser({
          ...res.user,
          id: res.user.uid,
          username: undefined,
          friends: [],
          friendRequests: [],
          authToken: authToken.get(),
        });
      // send login information to the backend
      if (!(await loginUser())) {
        // don't goto username
      } else {
        const u = user.get();
        if (!u.username || u.username === u.id) {
          loginState.set(UserState.registeringUsername);
          goto('/username');
        } else if (!u.musicPlatform) {
          loginState.set(UserState.registeringMusicPlatform);
          goto('/music_provider');
        } else goto('/');
      }
    } catch (e) {
      captureException(e.message);
      console.log(e);
    }
    loading.set(false);
  };
</script>

<div class="text-center flex flex-col h-full">
  <div class="pt-10">
    <img
      on:keypress={() => authTaps.set($authTaps + 1)}
      on:click={() => authTaps.set($authTaps + 1)}
      src={Icon}
      alt="FriendsFM Logo"
      class="mx-auto w-44 h-44"
    />
    <div class="mx-auto py-6 px-4 w-full">
      <h1 class="text-4xl">FriendsFM</h1>
      <p class="text-lg text-gray-400">
        the social way for you and your friends to enjoy music
      </p>
    </div>
  </div>
  <div class="mx-auto w-full align-bottom h-32 flex items-end flex-col">
    <button
      type="button"
      on:click={signInWithGoogle}
      class="my-1 mx-auto text-white w-[175px] bg-[#4285F4] hover:bg-[#4285F4]/90 focus:ring-4 focus:outline-none focus:ring-[#4285F4]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#4285F4]/55"
    >
      <svg
        class="mr-2 -ml-1 w-4 h-4"
        aria-hidden="true"
        focusable="false"
        data-prefix="fab"
        data-icon="google"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 488 512"
        ><path
          fill="currentColor"
          d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
        /></svg
      >
      Sign in with Google
    </button>
    <br />
    {#if $platform === 'ios'}
      <button
        on:click={signInWithApple}
        type="button"
        class="my-1 mx-auto text-white w-[175px] bg-[#050708] hover:bg-[#050708]/90 focus:ring-4 focus:outline-none focus:ring-[#050708]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#050708]/50 dark:hover:bg-[#050708]/30"
      >
        <svg
          class="mr-2 -ml-1 w-5 h-5"
          aria-hidden="true"
          focusable="false"
          data-prefix="fab"
          data-icon="apple"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 384 512"
          ><path
            fill="currentColor"
            d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
          /></svg
        >
        Sign in with Apple
      </button>
    {/if}
  </div>
</div>
