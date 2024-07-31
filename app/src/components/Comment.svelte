<script lang="ts">
  import { session } from '$lib/session';
  import { deleteCommentFromSubmission } from '$lib/submission';
  import type { Comment } from '$lib/types';
  import LoadingIndicator from './LoadingIndicator.svelte';

  export let comment: Comment;
  export let replyFunc: (username: string) => void;

  let deleting = false;

  const deleteComment = async () => {
    deleting = true;
    await deleteCommentFromSubmission(comment);
    deleting = false;
  };
</script>

<div class="relative bg-gray-800 rounded-md p-2 text-left">
  <p class="text-sm text-gray-400">@{comment.user.username}</p>
  <div class="pl-2">
    <p class="break-words">
      {@html comment.content.replace(
        /(@\w+)/g,
        '<span class="text-blue-500">$1</span>'
      )}
    </p>
  </div>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="text-blue-500 w-fit underline text-sm"
    on:keyup={() => replyFunc(comment.user.username)}
    on:click={() => replyFunc(comment.user.username)}
  >
    reply
  </div>
  {#if $session.user.id === comment.user.id}
    {#if !deleting}
      <button
        on:click={deleteComment}
        class="text-red-600 absolute right-1 top-2"
      >
        <svg
          fill="none"
          class="w-5 h-5"
          stroke="currentColor"
          stroke-width="1.5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
          ></path>
        </svg>
      </button>
    {:else}
      <LoadingIndicator className="absolute right-1 top-2 w-5 h-5" />
    {/if}
  {/if}
</div>
