<script lang="ts">
  import SpotifyLogoGreen from '../assets/spotify_logo_green.png';
  import SpotifyLogoWhite from '../assets/spotify_logo_white.png';
  import AppleMusicLogo from '../assets/apple_music_logo_white.svg';
  import AppleMusicListenOn from '../assets/apple_music_listen_on_white.svg';
  import { fly, scale, slide } from 'svelte/transition';
  import {
    convertDateToLateString,
    formatTimePlayed,
    getDaysAgo,
  } from '../lib/dates';
  import { goto, hashCode, intToRGB } from '../lib/util';
  import {
    activeSubmission,
    activeGenre,
    createCommentForSubmission,
    insets,
    activeHomeTab,
    publicProfileUsername,
    keyboardHeight,
    user,
  } from '../store';
  import Comment from '../components/Comment.svelte';
  import LoadingIndicator from '../components/LoadingIndicator.svelte';
  import { MusicPlatform } from '../types';
  import Button from '../components/Button.svelte';

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
    class="z-40 fixed top-0 left-0 w-full h-full bg-gray-700"
  >
    <div class="sticky top-0 w-full mx-auto">
      <div
        class={`w-full flex bg-${$activeSubmission.user.musicPlatform} flex-row rounded-t-lg justify-between items-center h-[55px] p-2`}
      >
        <button class="flex-grow-0 text-transparent w-8 h-8 p-1"></button>
        <button
          on:click={() => {
            goto('/public_profile');
            publicProfileUsername.set($activeSubmission?.user.username);
          }}
        >
          <h1 class="text-center pt-2 mx-auto text-2xl text-white flex-grow">
            {$activeSubmission?.user.username}
          </h1>
        </button>
        <button on:click={close} class="flex-grow-0 text-transparent"
          ><svg
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
              <img
                alt="spotify logo"
                class="h-6 mx-auto"
                src={AppleMusicLogo}
              />
            {/if}
          </div>
          <div class="pt-2">
            {#if $activeSubmission.song?.genre}
              <div
                on:keyup={() => {
                  activeGenre.set($activeSubmission.song.genre);
                  activeHomeTab.set('genres');
                  goto('/');
                }}
                on:click={() => {
                  activeGenre.set($activeSubmission.song.genre);
                  activeHomeTab.set('genres');
                  goto('/');
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
          <div class="mt-2 border-t-white border-t-2">
            <div class="flex w-72 mx-auto gap-4">
              {#if $activeSubmission.song.platforms?.find((p) => p.id === MusicPlatform.spotify)?.url}
                <div class="pt-2 w-52 mx-auto">
                  <Button
                    on:click={() =>
                      (window.location.href =
                        $activeSubmission.song.platforms?.find(
                          (p) => p.id === MusicPlatform.spotify
                        )?.url)}
                    type="spotify"
                    title="open in spotify"
                    className="flex gap-2 items-center justify-center bg-spotify"
                  >
                    <span class="text-transparent">a</span>
                    <img
                      alt="spotify logo"
                      class="h-6"
                      src={SpotifyLogoWhite}
                    />
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
                        )?.url)}
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
      <div
        transition:slide
        style={`height: calc(100vh - ${
          $insets.bottom * 2 +
          (focused
            ? ($keyboardHeight ? $keyboardHeight : 20) + 120
            : $keyboardHeight
            ? 470
            : 430)
        }px)`}
        class="overflow-y-scroll text-white border-t-white border-t-2 pb-1 pt-2 mt-2 block"
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
      <div
        transition:slide
        class={`w-full flex rounded-md pl-1 pr-2 border py-1 border-${$user.musicPlatform} shadow-md bg-gray-900 text-white`}
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
  </div>
{/if}
