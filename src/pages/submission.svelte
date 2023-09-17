<script lang="ts">
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

  let commentValue: string;
  let commentSubmitting = false;

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
            class="w-8 h-8 p-1 border-gray-700 rounded-md border bg-gray-800 text-spotify"
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
    <div class="flex bg-gray-700 py-2 px-4 h-full">
      <div class="w-full text-left">
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
        <a href={$activeSubmission.song.url}>
          <div class="flex mx-auto w-full py-2">
            {#if $activeSubmission.song.albumArtwork}
              <img
                alt="Album Artwork"
                class="w-24 rounded-sm mx-auto"
                src={$activeSubmission.song.albumArtwork}
              />
            {/if}
          </div>
          <div class="w-full mx-auto text-center">
            <div class="flex flex-col px-3 justify-start">
              {#if $activeSubmission.song.timestamp > 0}
                <span class="text-gray-400 text-center text-sm">
                  played {getDaysAgo(
                    new Date($activeSubmission.song?.timestamp)
                  )}
                  {#if !getDaysAgo(new Date($activeSubmission.song?.timestamp)).includes('days ago')}at
                    {formatTimePlayed($activeSubmission.song?.timestamp)}
                  {/if}
                </span>
              {/if}
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
        </a>
        <div>
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
          {#if $activeSubmission.audial && $activeSubmission.audial.number != -1}
            <div class="text-xs pt-1 w-full text-center">
              <p class="text-sm">
                audial #{$activeSubmission.audial.number}
              </p>
              {$activeSubmission.audial.score}
            </div>
          {/if}
        </div>
        <div class="mx-auto w-full h-full py-2 text-left">
          <div
            class="overflow-y-auto text-white h-full border-t-white border-t-2 block"
          >
            <div class="py-2">
              {#if !$activeSubmission.comments?.length}
                <span class="text-sm text-gray-300 w-full"
                  >no comments yet...</span
                >
              {/if}
              {#each $activeSubmission.comments as comment}
                <div
                  class="py-1"
                  out:fly={{ x: -document.body.clientWidth }}
                  in:slide
                >
                  <Comment {comment} />
                </div>
              {/each}
            </div>
            <div
              class="w-full flex border rounded-md shadow-md bg-gray-900 text-white"
            >
              <svg
                fill="none"
                class="p-1 w-1/12"
                stroke="currentColor"
                stroke-width="1.5"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                ></path>
              </svg>
              <input
                bind:value={commentValue}
                class="w-10/12 p-2 bg-transparent placeholder:text-gray-400 border-x-2 rounded-none border-white outline-none"
                placeholder="tap to start a comment"
              />
              {#if !commentSubmitting}
                <svg
                  on:click={submitComment}
                  fill="none"
                  class="p-1 w-1/12"
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
                <LoadingIndicator className={'p-1 w-1/12'} />
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
