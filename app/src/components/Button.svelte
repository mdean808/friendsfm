<script lang="ts">
  export let type: string;
  export let className = '';
  export let title: string;
  let buttonCSS: string;

  switch (type) {
    case 'primary':
      buttonCSS = 'bg-blue-600 hover:bg-blue-500 shadow-md';
      break;

    case 'submit':
      buttonCSS = 'bg-green-600 hover:bg-green-500';
      break;

    case 'warning':
      buttonCSS = 'bg-orange-600 hover:bg-orange-500';
      break;

    case 'breaking':
      buttonCSS = 'bg-red-600 hover:bg-red-500';
      break;

    case 'muted':
      buttonCSS = 'bg-gray-600 hover:bg-gray-500';
      break;

    case 'spotify':
      buttonCSS = 'bg-spotify hover:bg-green-500 shadow-md';
      break;
    case 'apple-music':
      buttonCSS = 'bg-apple-music hover:bg-apple-music-secondary shadow-md';
      break;

    case 'no-bg':
      buttonCSS = 'shadow-md';
      break;

    default:
      buttonCSS = 'bg-blue-600 hover:bg-blue-500';
      break;
  }
</script>

<button
  on:click
  {title}
  class={`p-2 text-white ${buttonCSS} w-full rounded-3xl shadow hover:shadow-lg transition-all duration-200 ${className}`}
>
  <slot />
</button>
