<script lang="ts">
  import Input from '$components/Input.svelte';
  import Button from '$components/Button.svelte';
  import LoadingIndicator from '$components/LoadingIndicator.svelte';
  import { fly, slide } from 'svelte/transition';
  import Tabs from '$components/Tabs.svelte';
  import All from '$components/friends/all.svelte';
  import Suggestions from '$components/friends/suggestions.svelte';
  import { session } from '$lib/session';
  import {
    acceptFriendRequest,
    rejectFriendRequest,
    sendFriendRequest,
  } from '$lib/friends';
  import { showToast } from '$lib/util';
  import { goto } from '$app/navigation';
  import { writable } from 'svelte/store';

  let newUsername = '';
  let loaders = $session.user.friendRequests.map(() => false);
  let loading = false;

  let focus = false;

  const addFriend = async () => {
    if (loading) return;
    loading = true;
    if (await sendFriendRequest(newUsername.trim())) {
      newUsername = '';
      showToast({ content: 'successfully sent friend request.' });
    }
    loading = false;
  };
  const acceptRequest = async (requester: string, i: number) => {
    // remove friendRequest from list
    const temp = [...$session.user.friendRequests][i];
    session.update((s) => {
      s.user.friendRequests = [...s.user.friendRequests].filter(
        (fr) => fr != temp
      );
      return s;
    });
    if (loaders[i]) return;
    loaders[i] = true;
    if (await acceptFriendRequest(requester))
      showToast({ content: 'successfully accepted friend request.' });
    // add fr back
    else
      session.update((s) => {
        s.user.friendRequests = [...s.user.friendRequests, temp];
        return s;
      });
    loaders[i] = false;
  };

  const rejectRequest = async (requester: string, i: number) => {
    // remove friendRequest from list
    const temp = [...$session.user.friendRequests][i];
    session.update((s) => {
      s.user.friendRequests = [...s.user.friendRequests].filter(
        (fr) => fr != temp
      );
      return s;
    });
    if (loaders[i]) return;
    loaders[i] = true;
    if (await rejectFriendRequest(requester))
      showToast({ content: 'successfully accepted friend request.' });
    // add fr back
    else
      session.update((s) => {
        s.user.friendRequests = [...s.user.friendRequests, temp];
        return s;
      });
    loaders[i] = false;
  };
</script>

<div
  in:fly={{
    duration: 200,
    x: -document.body.clientWidth,
  }}
  class="h-full"
>
  <div class="w-full flex flex-row justify-between items-center h-[55px] px-2">
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
    <button on:click={() => goto('/main/home')} class="flex-grow-0">
      <svg
        class={`w-8 h-8 p-1 border-gray-700 rounded-md border bg-gray-800 text-${$session.user.public.musicPlatform}`}
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
  <Tabs
    activeTab={writable('all')}
    tabs={[
      { name: 'your friends', component: All, id: 'all' },
      { name: 'suggestions', id: 'suggestions', component: Suggestions },
    ]}
  />
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
        {focus}
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
          title="Add Friend"
          on:click={() => addFriend()}
          className="w-full mx-1 px-0 py-0 h-full rounded-md my-auto text-3xl"
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
              d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </Button>
      {:else}
        <div class="w-8 h-8 mx-auto mt-1">
          <LoadingIndicator />
        </div>
      {/if}
    </div>
  </div>
  {#if $session.user.friendRequests.length > 0}
    <div class="bg-gray-900 border-white">
      <p
        class="text-2xl mx-auto text-center pt-3 pb-2 w-full border-b-2 border-white"
      >
        friend requests
      </p>
      <div class="bg-gray-800 max-h-[150px] h-auto overflow-scroll">
        {#each $session.user.friendRequests as username, i}
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
                title="Reject Request"
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
                title="Accept Request"
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
