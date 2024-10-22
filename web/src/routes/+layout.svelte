<script lang="ts">
  import '../app.css';
  import { FirebaseApp } from 'sveltefire';
  import { initializeApp } from 'firebase/app';
  import { getFirestore } from 'firebase/firestore';
  import { getAuth } from 'firebase/auth';
  import { getStorage } from 'firebase/storage';
  import { getDatabase } from 'firebase/database';
  import { getAnalytics, type Analytics } from 'firebase/analytics';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: 'AIzaSyBefRKyQloI4sGF-WRWkSTgZw1TSb5dz-g',
    authDomain: 'friendsfm.firebaseapp.com',
    databaseURL: 'https://friendsfm-default-rtdb.firebaseio.com',
    projectId: 'friendsfm',
    storageBucket: 'friendsfm.appspot.com',
    messagingSenderId: '611764643709',
    appId: '1:611764643709:web:6205eac2a611f00f348e14',
    measurementId: 'G-3EBNK0XRNT',
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const firestore = getFirestore(app);
  const auth = getAuth(app);
  const storage = getStorage(app);
  const rtdb = getDatabase(app);
  let analytics = $state({} as Analytics);

  onMount(() => {
    analytics = getAnalytics(app);
  });
</script>

<svelte:head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="apple-itunes-app" content="app-id=6445926913" />
  <meta property="og:title" content="FriendsFM" />
  <meta property="og:site_name" content="FriendsFM" />
  <meta property="og:url" content="https://friendsfm.app" />
  <meta
    property="og:description"
    content="the most social way to share your music."
  />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="https://friendsfm.app/img/icon.png" />
  <meta name="google-adsense-account" content="ca-pub-7468876972906134" />
  <title>friendsfm</title>
</svelte:head>

<FirebaseApp {storage} {rtdb} {analytics} {firestore} {auth}>
  <main class="container px-3 md:px-3 mx-auto">
    <div class="py-4">
      <div class="text-center mx-auto">
        <a href="/"><h1 class="text-4xl">friendsfm</h1></a>
        {#if $page.url.pathname === '/'}
          <p class="text-lg">the most social way to share your music.</p>
        {/if}
      </div>
      {@render children?.()}
    </div>
  </main>
  <footer class="shadow mx-auto bg-gray-700 w-full">
    <div class="w-full mx-auto p-4 md:flex md:items-center md:justify-between">
      <span class="text-sm sm:text-center text-gray-400"
        >© {new Date().getFullYear()}
        <a href="https://mogdan.xyz/" target="_blank" class="hover:underline"
          >Morgan Dean</a
        >. All Rights Reserved.
      </span>
      <ul
        class="flex flex-wrap items-center mt-3 text-sm font-medium text-gray-400 sm:mt-0"
      >
        <li>
          <a href="/account" class="hover:underline me-4 md:me-6">Account</a>
        </li>
        <li>
          <a href="/privacy" class="hover:underline me-4 md:me-6"
            >Privacy Policy</a
          >
        </li>
      </ul>
    </div>
  </footer>
</FirebaseApp>
