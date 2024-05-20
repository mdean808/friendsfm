<script lang="ts">
  import { goto } from '$app/navigation';
  import Button from '$components/Button.svelte';
  import TextArea from '$components/TextArea.svelte';
  import { session } from '$lib/session';
  import { showToast } from '$lib/util';
  import { fly } from 'svelte/transition';
  let feedback: string;

  const sendFeedback = async () => {
    //const eventId = Sentry.captureMessage('User Feedback');

    const userFeedback = {
      event_id: 0, //eventId,
      name: $session.user.public.username,
      email: $session.user.email,
      comments: feedback,
    };
    //Sentry.captureUserFeedback(userFeedback);
    feedback = '';
    showToast({ content: 'Successfully sent your message!' });
  };
</script>

<div
  in:fly={{
    duration: 200,
    x: document.body.clientWidth,
  }}
>
  <div
    class="w-full flex border-b-white border-b-2 flex-row justify-between items-center h-[55px] px-2"
  >
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
    <h1 class="text-center pt-2 mx-auto text-2xl text-white flex-grow">
      about
    </h1>
    <div class="flex-grow-0 text-transparent">
      <svg
        fill="none"
        class="w-8 h-8"
        stroke="currentColor"
        stroke-width="1.5"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15.75 19.5L8.25 12l7.5-7.5"
        ></path>
      </svg>
    </div>
  </div>
  <div class="mx-auto w-full py-2 px-4">
    <div class="py-4 text-left">
      <p>
        FriendsFM is a music-sharing application that sends a daily notification
        at a random time, encouraging each user to share their current listening
        preferences.
      </p>
      <p>
        The aim is to facilitate the exchange of musical interests among
        friends, fostering a continuous sharing of top tunes.
      </p>
    </div>
    <div class="py-2">
      <h1 class="text-xl">contact us</h1>
      <p class="text-gray-400 pb-2">
        Need support? Want to report an issue? Use the form below to give
        feedback!
      </p>
      <TextArea name="feedback" placeholder="" bind:value={feedback} />
      <div class="w-1/3">
        <Button type="primary" on:click={sendFeedback} title="submit"
          >Submit</Button
        >
      </div>
    </div>
    <div class="py-6 text-blue-600 text-left">
      <p class="text-left text-gray-400">created by morgan dean</p>
      <a target="_blank" href="https://friendsfm.app/privacy">privacy policy</a>
    </div>
  </div>
</div>
