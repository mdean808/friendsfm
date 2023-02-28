<script lang="ts">
  import { goto } from '../lib';
  import { user, sendFriendRequest, acceptFriendRequest } from '../store';
  import Input from '../components/Input.svelte';
  import Button from '../components/Button.svelte';
  import { toast } from '@zerodevx/svelte-toast';
  import LoadingIndicator from '../components/LoadingIndicator.svelte';
  let username = '';
  let loading = false;

  const addFriend = async () => {
    loading = true;
    if (await sendFriendRequest(username))
      toast.push('Succcessfully sent friend request');
    loading = false;
  };
  const acceptRequest = async (requester: string) => {
    loading = true;
    if (await acceptFriendRequest(requester))
      toast.push('Succcessfully accepted friend request');
    loading = false;
  };
</script>

<div class="z-40 fixed top-0 left-0 bg-gray-900 w-full h-full">
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
    <button on:click={() => goto('/')} class="flex-grow-0">
      <svg
        fill="none"
        stroke="currentColor"
        class="w-8 h-8"
        stroke-width="1.5"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>
  <div class="bg-gray-800">
    {#each $user.friends as friend}
      <div class="w-full border-b-white border-b-2 py-1 px-3">
        <span class="text-gray-200 text-xl inline-block">@</span><span
          class="text-white inline-block">{friend}</span
        >
      </div>
    {/each}
  </div>
  <div class="px-2 py-2 flex bg-gray-800">
    <div
      class="inline-block py-1 px-1 border-2 border-gray-600 text-gray-400 w-2/12 text-center mr-1 rounded-sm"
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
      <Input placeholder="johndoe20" name="username" bind:value={username} />
    </div>
    <div class="w-2/12">
      {#if !loading}
        <Button
          type="submit"
          title="Add friend"
          on:click={() => addFriend()}
          className="w-full mx-1 px-0 py-0 h-full my-auto text-3xl"
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
  <div class="bg-gray-900 border-t-2 border-white">
    <p
      class="text-2xl mx-auto text-center pt-3 pb-2 w-full border-b-2 border-white"
    >
      friend requests
    </p>
    <div class="bg-gray-800">
      {#each $user.friendRequests as friend}
        <div class="w-full border-b-white text-lg border-b-2 py-1 px-3 flex">
          <span class="text-gray-200 inline-block text-center pt-2 w-1/12"
            >@</span
          ><span class="text-white inline-block w-9/12 pt-1.5">{friend}</span>
          {#if !loading}
            <Button
              type="submit"
              title="Add friend"
              on:click={() => acceptRequest(friend)}
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
</div>
