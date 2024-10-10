<script lang="ts">
  import SubmissionTime from './submission/Time.svelte';
  import { onDestroy, onMount } from 'svelte';
  import MusicPlatformIcon from './icons/MusicPlatformIcon.svelte';
  import { MusicPlatform, type Submission } from '$lib/types';
  import { session } from '$lib/session';
  import { goto } from '$app/navigation';
  import { chunkArray, currSubNumber, publicProfileUsername } from '$lib/util';
  import {
    loadUserSubmission,
    previewSubmission,
  } from '$lib/submission';
  import {
    FirebaseFirestore,
    type QueryCompositeFilterConstraint,
  } from '@capacitor-firebase/firestore';
  import { friendSubmissionsFilter } from '$lib/filters';

  let submission: Submission;
  let interval: NodeJS.Timeout;
  let loading = true;
  let friends: {
    id: string;
    username: string;
  }[] = [];

  onMount(async () => {
    // load user submission just in case
    loadUserSubmission();
    getFriends();
    const res = await previewSubmission();
    if (!res) return;
    submission = res.submission;
    loading = false;
    // update the preview every 15 seconds
    interval = setInterval(async () => {
      getFriends();
      const res = await previewSubmission();
      if (!res) return;
      submission = res.submission;
    }, 15000);
  });

  const getFriends = async () => {
    const userFriends = $session.user.friends;
    const friendIds = userFriends.map((f) => f.id);
    if (friendIds.length === 0) return;
    // chunk because of firestore limitations
    const friendIdChunks = chunkArray(friendIds, 30);
    const friendPromises = friendIdChunks.map(async (chunk) => {

      const docs = await FirebaseFirestore.getCollection({
        reference: 'submissions',
        compositeFilter: friendSubmissionsFilter(chunk),
      });

      return docs.snapshots.map((snapshot) => {
        return {
          id: snapshot.data?.userId as string,
          username:
            userFriends.find((f) => f.id === snapshot.data?.userId)?.username ||
            '',
        };
      });
    });

    const friendResults = await Promise.all(friendPromises);
    friends = friendResults.flat();
  };

  onDestroy(() => {
    clearInterval(interval);
  });
</script>

<div class={`border-white rounded-lg shadow-lg bg-gray-700`}>
  <!-- HEADER -->
  <div
    class={`flex p-2 relative rounded-t-lg ${
      submission?.currentlyListening
        ? `bg-gradient-to-r from-${$session.user.public.musicPlatform} via-blue-500 to-${$session.user.public.musicPlatform} background-animate`
        : `bg-${$session.user.public.musicPlatform}`
    }`}
  >
    <div class="flex-grow text-center">
      <p>submission preview</p>
    </div>
    <div class="absolute right-2">
      <MusicPlatformIcon
        className="h-5 w-5"
        id={$session.user.public.musicPlatform || MusicPlatform.spotify}
      />
    </div>
  </div>
  {#if submission?.song}
    <!-- SONG -->
    <div>
      <div
        class="bg-no-repeat bg-cover aspect-square rounded-b-lg"
        style={`background-image: url('${submission.song.albumArtwork}');`}
      >
        <div class="flex w-full items-end h-full text-center">
          <div
            class="relative p-2 rounded-md backdrop-blur-lg bg-gray-800 border-white shadow-md bg-opacity-60 border mx-auto mb-10 w-4/5"
          >
            <!-- BLUE DURATION BACKGROUND -->
            {#if submission.song.timestamp === 0}
              <div
                style={`width: ${
                  (submission.song.durationElapsed / submission.song.length) *
                  100
                }%`}
                class="absolute rounded-l-md left-0 top-0 h-full bg-blue-700 opacity-50 z-0"
              />
            {/if}
            <div class="sticky z-10">
              <SubmissionTime className="truncate w-full" data={submission} />
              <h2 class={`text-xl text-white`}>
                {submission.song.name}
              </h2>
              <h2 class="text-white">{submission.song.artist}</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="p-2 animate-pulse">
      <p class="h-4 mb-1 rounded-md bg-gray-500 w-1/4" />
      <div class="flex gap-2">
        <div class="h-12 w-12 rounded-md bg-gray-500"></div>
        <div class="w-48 flex justify-center align-middle flex-col">
          <p class="h-4 mb-1 rounded-md bg-gray-500 w-2/3" />
          <p class="h-4 rounded-md bg-gray-500 w-1/3" />
        </div>
      </div>
    </div>
  {/if}
</div>

<div class="my-2 border-t-2 border-white relative pt-2 pb-48">
  {#each friends as friend}
    <div>
      <div class={`flex p-2 rounded-t-lg bg-gray-500`}>
        <button
          on:click={(e) => {
            e.stopPropagation();
            goto('/modal/profile');
            publicProfileUsername.set(friend.username);
          }}
          class="flex-grow text-left"
        >
          <img
            class="w-5 h-5 inline rounded-full"
            src={`https://icotar.com/avatar/${
              friend?.username || 'undefined'
            }.svg`}
            alt="avatar"
          />
          {friend ? friend?.username : 'Unknown'}
        </button>
      </div>
      <div class="relative p-2 bg-gray-700 text-left mb-2 rounded-b-lg">
        <div
          class="absolute backdrop-blur-md w-full h-full rounded-b-lg left-0 top-0"
        />
        <p class="mb-1 text-sm text-gray-400">played yesterday at 12:30</p>
        <div class="flex gap-2">
          <img
            class="w-12 h-12 inline rounded-lg"
            src={`https://icotar.com/avatar/album-${
              friend?.username || 'undefined'
            }.svg`}
            alt="avatar"
          />
          <div class="w-48 flex justify-center align-middle flex-col">
            <p class="h-4 mb-1 text-blue-500">Cool Song Name</p>
            <p class="h-4">Cool Artist Name</p>
          </div>
        </div>
      </div>
    </div>
  {/each}
</div>
