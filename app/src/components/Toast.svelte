<script lang="ts">
  import { user } from '$lib/user';
  import { toast } from '$lib/util';
</script>

<button
  on:click={$toast.onClick}
  class="w-11/12 mx-auto flex justify-center py-2"
>
  <span
    class={`mx-auto rounded-full border bg-gray-900 px-6 py-4 border-${
      $toast.color ? '' : $user.musicPlatform
    }`}
    style={$toast.color ? `border-color: ${$toast.color}` : ''}
  >
    <span class="text-white w-full">{$toast.content}</span>
  </span>
</button>
