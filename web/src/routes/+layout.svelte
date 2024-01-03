<script lang="ts">
  import '../app.css';
  import { FirebaseApp } from 'sveltefire';
  import { initializeApp } from 'firebase/app';
  import { getFirestore } from 'firebase/firestore';
  import { getAuth } from 'firebase/auth';
  import { getStorage } from 'firebase/storage';
  import { getDatabase } from 'firebase/database';
  import type { Analytics } from 'firebase/analytics';

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: 'AIzaSyBefRKyQloI4sGF-WRWkSTgZw1TSb5dz-g',
    authDomain: 'friendsfm.firebaseapp.com',
    databaseURL: 'https://friendsfm-default-rtdb.firebaseio.com',
    projectId: 'friendsfm',
    storageBucket: 'friendsfm.appspot.com',
    messagingSenderId: '611764643709',
    appId: '1:611764643709:web:d86a26a4918d29f9348e14',
    measurementId: 'G-HQGHCKN11Z',
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const firestore = getFirestore(app);
  const auth = getAuth(app);
  const storage = getStorage(app);
  const rtdb = getDatabase(app);
  const analytics = {} as Analytics;
</script>

<svelte:head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>friendsfm</title>
</svelte:head>

<FirebaseApp {storage} {rtdb} {analytics} {firestore} {auth}>
  <body class="container p-6">
    <slot />
  </body>
</FirebaseApp>
