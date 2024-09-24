<script lang="ts">
  import SpotifyLogoGreen from '$assets/spotify_logo_green.png';
  import SpotifyLogoWhite from '$assets/spotify_logo_white.png';
  import AppleMusicLogo from '$assets/apple_music_logo_white.svg';
  import AppleMusicListenOn from '$assets/apple_music_listen_on_white.svg';
  import { fly, slide } from 'svelte/transition';
  import Comment from '$components/Comment.svelte';
  import LoadingIndicator from '$components/LoadingIndicator.svelte';
  import Button from '$components/Button.svelte';
  import { goto } from '$app/navigation';
  import {
    activeSubmission,
    createCommentForSubmission,
  } from '$lib/submission';
  import { insets, keyboardHeight } from '$lib/device';
  import {
    activeHomeTab,
    hashCode,
    intToRGB, prevPath,
    publicProfileUsername,
  } from '$lib/util';
  import {
    convertDateToLateString,
    formatTimePlayed,
    getDaysAgo,
  } from '$lib/dates';
  import { MusicPlatform } from '$lib/types';
  import { session } from '$lib/session';
  import { Capacitor } from '@capacitor/core';

  let commentValue: string;
  let commentSubmitting = false;
  let input: HTMLInputElement;
  let focused = false;
  let captionHeight: number;

  const submitComment = async () => {
    if (!commentValue) return;
    commentSubmitting = true;
    const tempVal = commentValue;
    commentValue = '';
    await createCommentForSubmission(tempVal);
    commentSubmitting = false;
  };

  const close = () => {
    console.log($prevPath)
    goto($prevPath);
    activeSubmission.set(null);
  };

  const replyFunc = (username: string) => {
    commentValue = `@${username} `;
    input.focus();
  };
</script>

{#if $activeSubmission?.user}
  <div
    class={`w-full flex bg-${$activeSubmission.user.musicPlatform} flex-row rounded-t-lg justify-between items-center h-[55px] p-2`}
  >
    <button class="flex-grow-0 text-transparent w-8 h-8 p-1"></button>
    <button
      on:click={() => {
        goto('/modal/profile');
        publicProfileUsername.set($activeSubmission.user.id);
      }}
    >
      <h1 class="text-center pt-2 mx-auto text-2xl text-white flex-grow">
        {$activeSubmission?.user.username}
      </h1>
    </button>
    <button on:click={close} class="flex-grow-0 text-transparent">
      <svg
        class={`w-8 h-8 p-1 border-gray-700 rounded-md border bg-gray-800 text-${$activeSubmission.user.musicPlatform}`}
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M6 18L18 6M6 6l12 12"
        ></path>
      </svg>
    </button>
  </div>
  <div class="bg-gray-700 py-2 px-4 w-full">
    {#if !focused || Capacitor.getPlatform() == 'web'}
      <div transition:slide>
        {#if !$activeSubmission.late}
          <span class="text-sm text-center block text-gray-400"
            >{$activeSubmission.time?.toLocaleString('en-US', {
              hour: 'numeric',
              minute: 'numeric',
              hour12: true,
            })}
          </span>
        {:else}
          <span class="text-sm text-center block text-red-500">
            {convertDateToLateString($activeSubmission.lateTime)}
          </span>
        {/if}
        {#if $activeSubmission.song.timestamp > 0}
          <span class="text-gray-400 w-full block text-center text-sm">
            played {getDaysAgo(new Date($activeSubmission.song?.timestamp))}
            {#if !getDaysAgo(new Date($activeSubmission.song?.timestamp)).includes('days ago')}at
              {formatTimePlayed($activeSubmission.song?.timestamp)}
            {/if}
          </span>
        {/if}
        <div>
          <div class="flex mx-auto w-full py-1">
            {#if $activeSubmission.song.albumArtwork}
              <img
                alt="Album Artwork"
                class="w-24 h-24 mx-auto"
                src={$activeSubmission.song.albumArtwork}
              />
            {/if}
          </div>
          <div class="w-full mx-auto text-center">
            <div class="flex flex-col px-3 justify-start">
              <span
                class={`w-full truncate text-${$activeSubmission.user.musicPlatform}`}
              >
                {$activeSubmission.song.name}
              </span>
              <span class="w-full truncate text-gray-100">
                {$activeSubmission.song.artist}
              </span>
            </div>
          </div>
          {#if $activeSubmission.user.musicPlatform === MusicPlatform.spotify}
            <img
              alt="spotify logo"
              class="h-4 my-1 mx-auto"
              src={SpotifyLogoGreen}
            />
          {:else}
            <img alt="spotify logo" class="h-6 mx-auto" src={AppleMusicLogo} />
          {/if}
        </div>
        <div class="pt-2">
          {#if $activeSubmission.song?.genre}
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div
              on:keyup={() => {
                activeHomeTab.set('genres');
                goto('/main/home');
              }}
              on:click={() => {
                activeHomeTab.set('genres');
                goto('/main/home');
              }}
              class="text-xs w-fit border-white border mx-auto items-center leading-sm
        uppercase px-3 pb-1 pt-1.5 rounded-full"
              style={`background: ${intToRGB(
                hashCode($activeSubmission.song.genre, 23)
              )}; `}
            >
              <span>{$activeSubmission.song.genre}</span>
            </div>
          {/if}
        </div>
        <div class="flex pb-2 mt-2 border-white border-b-2 border-t-2">
          <div class="flex w-72 mx-auto gap-4">
            {#if $activeSubmission.song.platforms?.find((p) => p.id === MusicPlatform.spotify)?.url}
              <div class="pt-2 w-52 mx-auto">
                <Button
                  on:click={() =>
                    (window.location.href =
                      $activeSubmission.song.platforms?.find(
                        (p) => p.id === MusicPlatform.spotify
                      )?.url || '#')}
                  type="spotify"
                  title="open in spotify"
                  className="flex gap-2 items-center justify-center bg-spotify"
                >
                  <span class="text-transparent">a</span>
                  <img alt="spotify logo" class="h-6" src={SpotifyLogoWhite} />
                  <span class="text-transparent">a</span>
                </Button>
              </div>
            {/if}
            {#if $activeSubmission.song.platforms?.find((p) => p.id === MusicPlatform.appleMusic)?.url}
              <div class="pt-2 w-52 mx-auto">
                <Button
                  on:click={() =>
                    (window.location.href =
                      $activeSubmission.song.platforms?.find(
                        (p) => p.id === MusicPlatform.appleMusic
                      )?.url || '#')}
                  type="apple-music"
                  title="open in apple music"
                  className="flex gap-2 items-center justify-center"
                >
                  <img
                    alt="apple music logo"
                    class="h-6"
                    src={AppleMusicListenOn}
                  />
                </Button>
              </div>
            {/if}
            {#if !$activeSubmission.song.platforms?.find((p) => p.id === MusicPlatform.appleMusic)?.url && !$activeSubmission.song.platforms?.find((p) => p.id === MusicPlatform.spotify)?.url}
              <div class="pt-2 w-52 mx-auto">
                <Button
                  on:click={() =>
                    (window.location.href = $activeSubmission.song.url)}
                  type={$activeSubmission.user.musicPlatform}
                  title={`open in ${$activeSubmission.user.musicPlatform}`}
                  className="flex gap-2 items-center justify-center"
                >
                  <img
                    alt={`${$activeSubmission.user.musicPlatform} logo`}
                    class="h-6"
                    src={$activeSubmission.user.musicPlatform ===
                    MusicPlatform.spotify
                      ? SpotifyLogoWhite
                      : AppleMusicListenOn}
                  />
                </Button>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
    {#if $activeSubmission.caption}
      <div
        bind:clientHeight={captionHeight}
        class="flex py-1 border-white border-b-2"
      >
        <p class="text-center w-full italic">
          {$activeSubmission?.caption}
        </p>
      </div>
    {/if}
    <div
      transition:slide
      style={`height: calc(100vh - ${
        ($insets.bottom ? $insets.bottom + 50 : 0) +
        (focused ? $keyboardHeight + 441 : 441) +
        ($activeSubmission.caption ? captionHeight : 0)
      }px)`}
      class="overflow-y-scroll text-white pb-1 pt-2 block"
    >
      {#if !$activeSubmission.comments?.length}
        <span class="text-sm text-gray-300 w-full">no comments yet...</span>
      {/if}
      {#each $activeSubmission.comments as comment}
        <div class="py-1" out:fly={{ x: -document.body.clientWidth }} in:slide>
          <Comment {comment} {replyFunc} />
        </div>
      {/each}
    </div>
    <div
      transition:slide
      class={`w-full flex rounded-md pl-1 pr-2 border py-1 border-${$session.user.public.musicPlatform} shadow-md bg-gray-900 text-white`}
    >
      <div class="py-1 w-10/12 rounded-none">
        <input
          bind:value={commentValue}
          bind:this={input}
          on:focusin={() => (focused = true)}
          on:focusout={() => (focused = false)}
          on:keyup={(e) => e.key === 'Enter' && submitComment()}
          class="bg-gray-900 w-full placeholder:text-gray-400 rounded-md p-1 outline-none"
          placeholder="tap to start a comment"
        />
      </div>
      {#if !commentSubmitting}
        <button
          on:click={submitComment}
          class="ml-auto self-center rounded-full py-1 pl-1.5 pr-1 h-9 w-9 bg-blue-600 text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 256 256"
            ><path
              d="M232,127.89a16,16,0,0,1-8.18,14L55.91,237.9A16.14,16.14,0,0,1,48,240a16,16,0,0,1-15.05-21.34L60.3,138.71A4,4,0,0,1,64.09,136H136a8,8,0,0,0,8-8.53,8.19,8.19,0,0,0-8.26-7.47H64.16a4,4,0,0,1-3.79-2.7l-27.44-80A16,16,0,0,1,55.85,18.07l168,95.89A16,16,0,0,1,232,127.89Z"
            ></path></svg
          >
        </button>
      {:else}
        <LoadingIndicator
          className="ml-auto self-center rounded-full py-1 pl-1.5 pr-1 h-9 w-9 bg-blue-600 text-white"
        />
      {/if}
    </div>
  </div>
{/if}
