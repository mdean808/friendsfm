<script lang="ts">
  import Spotify from '../../assets/spotify_icon_white.png';
  export let id: string;
  export let className: string = '';
</script>

{#if id === 'spotify'}
  <img alt="spotify logo" src={Spotify} class={className} />
{:else if id === 'apple-music'}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    class={className}
    viewBox="0 0 256 256"
    ><path
      d="M130.7,29.6A40.2,40.2,0,0,1,168,4a8,8,0,0,1,0,16,24.1,24.1,0,0,0-22.4,15.4,8,8,0,0,1-7.5,5.1,9.2,9.2,0,0,1-2.8-.5A8,8,0,0,1,130.7,29.6ZM222,155.8a40,40,0,0,1-2.7-70A8.2,8.2,0,0,0,221.5,74,68,68,0,0,0,128,61,68,68,0,0,0,20,116a135,135,0,0,0,22.9,74c14.4,21.3,32.7,34,49.1,34h72c22.5,0,47.9-23.9,61.9-58A7.9,7.9,0,0,0,222,155.8Z"
    /></svg
  >
{/if}
