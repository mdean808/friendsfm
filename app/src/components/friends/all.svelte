<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import LoadingIndicator from '../LoadingIndicator.svelte';
  import { Share } from '@capacitor/share';
  import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
  import { Capacitor } from '@capacitor/core';
  import { session } from '$lib/session';
  import { publicProfileUsername } from '$lib/util';
  import { goto } from '$app/navigation';

  const swipePosStart = { x: 0, y: 0 };
  const swipePosCurrent = { x: 0, y: 0 };
  let shouldRefreshOnSwipeEnd = false;
  let loadingFriends = false;

  const swipeStart = (e: TouchEvent) => {
    const touch = e.targetTouches[0];
    if (touch) {
      swipePosStart.x = touch.screenX;
      swipePosStart.y = touch.screenY;
    }
  };

  const swipeMove = (e: TouchEvent) => {
    const touch = e.targetTouches[0];
    if (touch) {
      swipePosCurrent.x = touch.screenX;
      swipePosCurrent.y = touch.screenY;
    }
    const changeInY = swipePosCurrent.y - swipePosStart.y;
    if (
      (document?.getElementById('friends')?.scrollTop || 1) <= 0 &&
      changeInY > 100
    )
      shouldRefreshOnSwipeEnd = true;
    else shouldRefreshOnSwipeEnd = false;
  };

  const swipeEnd = async () => {
    if (shouldRefreshOnSwipeEnd && !loadingFriends) {
      loadingFriends = true;
      loadingFriends = false;
      shouldRefreshOnSwipeEnd = false;
    }
  };
  onMount(async () => {
    if (Capacitor.isPluginAvailable('Keyboard'))
      Keyboard.setResizeMode({ mode: KeyboardResize.Native });
    document.addEventListener('touchstart', swipeStart, false);
    document.addEventListener('touchmove', swipeMove, false);
    document.addEventListener('touchend', swipeEnd, false);
  });
  onDestroy(() => {
    if (Capacitor.isPluginAvailable('Keyboard'))
      Keyboard.setResizeMode({ mode: KeyboardResize.None });
    document.addEventListener('touchstart', swipeStart, false);
    document.addEventListener('touchmove', swipeMove, false);
    document.addEventListener('touchend', swipeEnd, false);
  });
</script>

<div id="friends">
  {#if shouldRefreshOnSwipeEnd}
    <div transition:slide class="mx-auto">
      {#if !loadingFriends}
        <p
          class="mx-auto w-fit py-0.5 px-3 rounded-lg bg-gray-900 animate-pulse"
        >
          release to refresh
        </p>
      {:else}
        <LoadingIndicator className="w-8 h-8 my-2 mx-auto" />
      {/if}
    </div>
  {/if}
  <div
    style={`max-height: calc(100vh - 211px)`}
    class="bg-gray-800 h-auto overflow-scroll"
  >
    {#each $session.user.friends as friend}
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        on:keypress={() => {
          publicProfileUsername.set(friend.username);
          goto('/modal/profile');
        }}
        on:click={() => {
          publicProfileUsername.set(friend.username);
          goto('/modal/profile');
        }}
        transition:slide
        class="w-full border-b-white border-b-2 flex justify-between py-4 px-3"
      >
        <div class="">
          <img
            class="w-5 h-5 rounded-full inline-block mx-auto"
            alt="User Avatar"
            src={`https://icotar.com/avatar/${friend.username}.svg`}
          />
          <span class="text-white inline-block">{friend.username}</span>
        </div>
        <div class="">
          <svg
            on:click={(e) => {
              e.stopPropagation();
              Share.share({
                url: `https://friendsfm.app/user/${friend.username}`,
              });
            }}
            on:keypress={(e) => {
              e.stopPropagation();
              Share.share({
                url: `https://friendsfm.app/user/${friend.username}`,
              });
            }}
            class="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 256 256"
            ><path
              d="M216,112v96a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V112A16,16,0,0,1,56,96H80a8,8,0,0,1,0,16H56v96H200V112H176a8,8,0,0,1,0-16h24A16,16,0,0,1,216,112ZM93.66,69.66,120,43.31V136a8,8,0,0,0,16,0V43.31l26.34,26.35a8,8,0,0,0,11.32-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,93.66,69.66Z"
            ></path></svg
          >
        </div>
      </div>
    {/each}
  </div>
</div>
