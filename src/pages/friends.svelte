<script lang="ts">
  import { getPlatformColor, goto } from '../lib';
  import {
    user,
    sendFriendRequest,
    acceptFriendRequest,
    prevPath,
    rejectFriendRequest,
    refreshUser,
    appLoading,
    publicProfileUsername,
  } from '../store';
  import Input from '../components/Input.svelte';
  import Button from '../components/Button.svelte';
  import { toast } from '@zerodevx/svelte-toast';
  import LoadingIndicator from '../components/LoadingIndicator.svelte';
  import { onDestroy, onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import { Share } from '@capacitor/share';

  let newUsername = '';
  let loaders = $user.friendRequests.map(() => false);
  let loading = false;

  const addFriend = async () => {
    if (loading) return;
    loading = true;
    if (await sendFriendRequest(newUsername.trim())) {
      newUsername = '';
      toast.push('Succcessfully sent friend request');
    }
    loading = false;
  };
  const acceptRequest = async (requester: string, i: number) => {
    if (loaders[i]) return;
    loaders[i] = true;
    if (await acceptFriendRequest(requester))
      toast.push('Succcessfully accepted friend request');
    loaders[i] = false;
  };

  const rejectRequest = async (requester: string, i: number) => {
    if (loaders[i]) return;
    loaders[i] = true;
    if (await rejectFriendRequest(requester))
      toast.push('Succcessfully rejected friend request');
    loaders[i] = false;
  };

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
    if (document.getElementById('friends')?.scrollTop <= 0 && changeInY > 100)
      shouldRefreshOnSwipeEnd = true;
    else shouldRefreshOnSwipeEnd = false;
  };

  const swipeEnd = async () => {
    if (shouldRefreshOnSwipeEnd && !loadingFriends) {
      loadingFriends = true;
      await refreshUser();
      loadingFriends = false;
      shouldRefreshOnSwipeEnd = false;
    }
  };
  onMount(async () => {
    // if (!appCheckToken.get()) await getAppCheckToken();
    // setup pull to refresh
    document.addEventListener('touchstart', swipeStart, false);
    document.addEventListener('touchmove', swipeMove, false);
    document.addEventListener('touchend', swipeEnd, false);
    await refreshUser();
    appLoading.set(false);
  });
  onDestroy(() => {
    document.addEventListener('touchstart', swipeStart, false);
    document.addEventListener('touchmove', swipeMove, false);
    document.addEventListener('touchend', swipeEnd, false);
  });
</script>

<div id="friends" class="h-full">
  <div
    class="w-full flex border-b-white border-b-2 flex-row justify-between items-center h-[55px] px-2"
  >
    <div class="flex-grow-0 text-transparent">
      <svg
        class="w-8 h-8"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
        ><path
          d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"
        /></svg
      >
    </div>
    <h1 class="text-center pt-2 mx-auto text-2xl text-white flex-grow">
      friends
    </h1>
    <button
      on:click={() => goto($prevPath === '/public_profile' ? '/' : $prevPath)}
      class="flex-grow-0"
    >
      <svg
        class={`w-8 h-8 p-1 border-gray-700 rounded-md border bg-gray-800 text-${getPlatformColor(
          $user.musicPlatform
        )} `}
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
          d="M8.25 4.5l7.5 7.5-7.5 7.5"
        />
      </svg>
    </button>
  </div>
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
  <div class="bg-gray-800 max-h-[50%] h-auto overflow-scroll">
    {#each $user.friends as friend}
      <div
        on:keypress={() => {
          publicProfileUsername.set(friend.username);
          goto('/public_profile');
        }}
        on:click={() => {
          publicProfileUsername.set(friend.username);
          goto('/public_profile');
        }}
        transition:slide
        class="w-full border-b-white border-b-2 flex justify-between py-2 px-3"
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
                url: `https://friendsfm.mogdan.xyz/user/${friend.username}`,
              });
            }}
            on:keypress={(e) => {
              e.stopPropagation();
              Share.share({
                url: `https://friendsfm.mogdan.xyz/user/${friend.username}`,
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
  <div class="px-2 py-2 flex bg-gray-800 border-b-2 border-white">
    <div
      class="inline-block py-1 px-1 border-2 border-r-0 rounded-sm rounded-r-none border-gray-600 text-gray-400 w-2/12 text-center"
    >
      <svg
        fill="none"
        class="w-6 h-6 mx-auto mt-1"
        stroke="currentColor"
        stroke-width="1.5"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25"
        />
      </svg>
    </div>
    <div class="w-8/12">
      <Input
        placeholder="username"
        name="username"
        className="rounded-l-none"
        bind:value={newUsername}
      />
    </div>
    <div class="w-2/12">
      {#if !loading}
        <Button
          type="primary"
          title="Add friend"
          on:click={() => addFriend()}
          className="w-full mx-1 px-0 py-0 h-full rounded-md my-auto text-3xl"
          ><svg
            fill="none"
            class="w-6 h-6 mx-auto"
            stroke="currentColor"
            stroke-width="1.5"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg></Button
        >
      {:else}
        <div class="w-8 h-8 mx-auto mt-1">
          <LoadingIndicator />
        </div>
      {/if}
    </div>
  </div>
  {#if $user.friendRequests.length > 0}
    <div class="bg-gray-900 border-white">
      <p
        class="text-2xl mx-auto text-center pt-3 pb-2 w-full border-b-2 border-white"
      >
        friend requests
      </p>
      <div class="bg-gray-800 max-h-[150px] h-auto overflow-scroll">
        {#each $user.friendRequests as username, i}
          <div
            transition:slide
            class="w-full border-b-white text-lg border-b-2 py-1 px-3 flex"
          >
            <span class="text-gray-200 inline-block text-center pt-2 w-1/12"
              >@</span
            ><span class="text-white inline-block w-9/12 pt-1.5"
              >{username}</span
            >
            {#if !loaders[i]}
              <Button
                type="breaking"
                title="Add friend"
                on:click={() => rejectRequest(username, i)}
                className="w-2/12 mr-2 rounded-md h-full my-auto text-3xl"
              >
                <svg
                  fill="none"
                  class="w-6 h-6 mx-auto"
                  stroke="currentColor"
                  stroke-width="1.5"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </Button>
              <Button
                type="submit"
                title="Add friend"
                on:click={() => acceptRequest(username, i)}
                className="w-2/12 h-full my-auto text-3xl"
              >
                <svg
                  fill="none"
                  class="w-6 h-6 mx-auto"
                  stroke="currentColor"
                  stroke-width="1.5"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </Button>
            {:else}
              <div class="w-8 h-8 mx-auto mt-1">
                <LoadingIndicator />
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
