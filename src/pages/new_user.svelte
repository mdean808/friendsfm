<script lang="ts">
  import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
  import { goto } from '../lib';
  import {
    authToken,
    getNewAuthToken,
    loading,
    loginUser,
    updateUser,
    user,
  } from '../store';

  const signInWithGoogle = async () => {
    loading.set(true);
    const res = await FirebaseAuthentication.signInWithGoogle();
    await getNewAuthToken();
    if (!res.user.email)
      await updateUser({
        ...res.user,
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
      if (!u.username) goto('/username');
      else if (!u.musicPlatform) goto('/music_provider');
      else goto('/');
    }
    loading.set(false);
  };
</script>

<main class="text-center">
  <!-- INFO: Temporary Logo -->
  <svg
    class="mx-auto mt-8 w-32 h-32"
    fill="currentColor"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
    ><path
      fill-rule="evenodd"
      d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
      clip-rule="evenodd"
    /></svg
  >
  <div class="mx-auto py-6 px-4 w-full">
    <h1 class="text-4xl">FriendsFM</h1>
    <p class="text-lg text-gray-400">
      Some really good description/tagline that makes me want to sign up!
    </p>
  </div>
  <div class="mx-auto w-full mt-48">
    <button
      type="button"
      on:click={signInWithGoogle}
      class="my-1 mx-auto text-white bg-[#4285F4] hover:bg-[#4285F4]/90 focus:ring-4 focus:outline-none focus:ring-[#4285F4]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#4285F4]/55"
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
    <button
      type="button"
      class="my-1 mx-auto text-white bg-[#050708] hover:bg-[#050708]/90 focus:ring-4 focus:outline-none focus:ring-[#050708]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#050708]/50 dark:hover:bg-[#050708]/30"
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
  </div>
</main>
