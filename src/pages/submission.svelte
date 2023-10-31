<script lang="ts">
  import SpotifyLogo from '../assets/spotify_logo_green.png';
  import AppleMusicLogo from '../assets/apple_music_logo_white.svg';
  import { fly, scale, slide } from 'svelte/transition';
  import {
    convertDateToLateString,
    formatTimePlayed,
    getDaysAgo,
    getPlatformColor,
    goto,
    hashCode,
    intToRGB,
  } from '../lib';
  import {
    activeSubmission,
    activeGenre,
    createCommentForSubmission,
    insets,
  } from '../store';
  import Comment from '../components/Comment.svelte';
  import LoadingIndicator from '../components/LoadingIndicator.svelte';
  import { MusicPlatform } from '../types';

  let commentValue: string;
  let commentSubmitting = false;
  let input: HTMLInputElement;
  let focused = false;

  const submitComment = async () => {
    if (!commentValue) return;
    commentSubmitting = true;
    await createCommentForSubmission(commentValue);
    commentValue = '';
    commentSubmitting = false;
  };

  const close = () => {
    goto('/');
    activeSubmission.set(null);
  };

  const replyFunc = (username: string) => {
    commentValue = `@${username} `;
    input.focus();
  };
</script>

{#if $activeSubmission?.user}
  <div
    style={`padding-top: ${0 + $insets.top}px`}
    transition:scale
    class="z-50 fixed top-0 left-0 w-full h-full bg-gray-800"
  >
    <div class="sticky top-0 w-full mx-auto">
      <div
        class={`w-full flex bg-${getPlatformColor(
          $activeSubmission.user.musicPlatform
        )} flex-row rounded-t-lg justify-between items-center h-[55px] p-2`}
      >
        <button class="flex-grow-0 text-transparent w-8 h-8 p-1"></button>
        <h1 class="text-center pt-2 mx-auto text-2xl text-white flex-grow">
          {$activeSubmission?.user.username}
        </h1>
        <button on:click={close} class="flex-grow-0 text-transparent"
          ><svg
            class={`w-8 h-8 p-1 border-gray-700 rounded-md border bg-gray-800 text-${getPlatformColor(
              $activeSubmission.user.musicPlatform
            )}`}
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
    </div>
    <div class="bg-gray-700 py-2 px-4 pb-[50px] w-full">
      {#if !focused}
        <div transition:slide>
          {#if !$activeSubmission.late}
            <span class="text-sm text-center block text-gray-400"
              >{new Date($activeSubmission.time).toLocaleString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
              })}
            </span>
          {:else}
            <span class="text-sm text-center block text-red-500">
              {convertDateToLateString(new Date($activeSubmission.lateTime))}
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
          <a href={$activeSubmission.song.url}>
            <div class="flex mx-auto w-full py-1">
              {#if $activeSubmission.song.albumArtwork}
                <img
                  alt="Album Artwork"
                  class="w-24 mx-auto"
                  src={$activeSubmission.song.albumArtwork}
                />
              {/if}
            </div>
            <div class="w-full mx-auto text-center">
              <div class="flex flex-col px-3 justify-start">
                <span
                  class={`w-full truncate text-${getPlatformColor(
                    $activeSubmission.user.musicPlatform
                  )}`}
                >
                  {$activeSubmission.song.name}
                </span>
                <span class="w-full truncate text-gray-100">
                  {$activeSubmission.song.artist}
                </span>
              </div>
            </div>
            {#if $activeSubmission.user.musicPlatform === MusicPlatform.spotify}
              <img alt="spotify logo" class="h-6 mx-auto" src={SpotifyLogo} />
            {:else}<!-- apple music icon-->

              <img
                alt="spotify logo"
                class="h-6 mx-auto"
                src={AppleMusicLogo}
              />
            {/if}
          </a>
          <div class="pt-2">
            {#if $activeSubmission.song?.genre}
              <div
                on:keyup={() => {
                  activeGenre.set($activeSubmission.song.genre);
                  goto('/genre');
                }}
                on:click={() => {
                  activeGenre.set($activeSubmission.song.genre);
                  goto('/genre');
                }}
                class="text-xs w-fit mx-auto items-center leading-sm
        uppercase px-3 pb-1 pt-1.5 rounded-full"
                style={`background: ${intToRGB(
                  hashCode($activeSubmission.song.genre, 23)
                )}; `}
              >
                <span>{$activeSubmission.song.genre}</span>
              </div>
            {/if}
          </div>
        </div>
      {/if}
      <div
        style={`height: calc(100vh - ${
          $insets.bottom + (!focused ? 375 : 0)
        }px)`}
        class="overflow-y-scroll text-white border-t-white border-t-2 pt-2 mt-2 block"
      >
        {#if !$activeSubmission.comments?.length}
          <span class="text-sm text-gray-300 w-full">no comments yet...</span>
        {/if}
        {#each $activeSubmission.comments as comment}
          <div
            class="py-1"
            out:fly={{ x: -document.body.clientWidth }}
            in:slide
          >
            <Comment {comment} {replyFunc} />
          </div>
        {/each}
      </div>
    </div>
    <div
      style={`bottom: ${focused ? 0 : $insets.bottom}px;`}
      class="w-full absolute flex rounded-none border-t border-b py-1 shadow-md bg-gray-900 text-white"
    >
      <div class="p-2 w-10/12 rounded-none">
        <input
          bind:value={commentValue}
          bind:this={input}
          on:submit={submitComment}
          on:keyup={(e) => e.key === 'Enter' && submitComment()}
          on:focusin={() => (focused = true)}
          on:focusout={() => (focused = false)}
          class="bg-gray-900 w-full placeholder:text-gray-400 rounded-md p-1 outline-none"
          placeholder="tap to start a comment"
        />
      </div>
      {#if !commentSubmitting}
        <svg
          on:click={submitComment}
          fill="none"
          class="p-1 h-9 w-9 mx-auto bg-blue-600 mt-1 rounded-full"
          stroke="currentColor"
          stroke-width="1.5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
          ></path>
        </svg>
      {:else}
        <LoadingIndicator
          className={'p-1 h-9 w-9 mx-auto bg-blue-600 mt-1 rounded-full'}
        />
      {/if}
    </div>
  </div>
{/if}
