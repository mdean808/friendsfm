<script lang="ts">
  import { toast } from '$lib/util';
  import { user } from '$lib/user';
</script>

<button
  on:click={$toast.onClick}
  class="w-11/12 mx-auto flex justify-center py-2"
>
  <div
    class={`mx-auto rounded-full border bg-gray-900 px-6 py-4 border-${
      $toast.color ? '' : $user.musicPlatform
    }`}
    style={$toast.color ? `border-color: ${$toast.color}` : ''}
  >
    <span class="text-white w-full">{$toast.content}</span>
  </div>
</button>
