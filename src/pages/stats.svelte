<script lang="ts">
  import { formatDurationPlayed, getPlatformColor } from '../lib';
  import { toggleSong, user, userStatistics } from '../store';
</script>

<div>
  <div class="text-white mx-auto text-center">
    <h2 class="text-blue-600">submissions</h2>
    <p>{$userStatistics.submissionCount}</p>
    <h2 class="text-green-600">on-time submissions</h2>
    <p>
      {Math.trunc(
        ($userStatistics.onTimeSubmissionCount /
          $userStatistics.submissionCount) *
          100
      )}%
    </p>
    {#if $userStatistics?.topSong}
      <h2 class="text-pink-500 my-1">most common song</h2>
      <div
        class="text-left bg-gray-700 rounded-md px-2 mx-4 py-2 mb-2 flex space-x-4"
      >
        <a
          href={$userStatistics.topSong.url}
          class="flex flex-grow items-center"
        >
          {#if $userStatistics.topSong.albumArtwork}
            <div>
              <img
                alt="Album Artwork"
                class="w-16 h-16 mr-3 rounded-sm"
                src={$userStatistics.topSong.albumArtwork}
              />
            </div>
          {/if}
          <div class={$userStatistics.topSong.albumArtwork ? 'w-52' : 'w-64'}>
            <h1
              class={`truncate text-${getPlatformColor($user.musicPlatform)}`}
            >
              {$userStatistics.topSong.name}
            </h1>
            <p class="text-white truncate">
              {$userStatistics.topSong.artist}
            </p>
            <p class="text-sm truncate text-gray-500">
              {formatDurationPlayed($userStatistics.topSong.length)}
            </p>
          </div>
        </a>
        <div class="flex-grow-0 flex-shrink">
          <svg
            on:click={() => toggleSong($userStatistics.topSong)}
            on:keypress={() => toggleSong($userStatistics.topSong)}
            class="w-6 h-6 ml-auto flex-grow-0 flex-shrink text-pink-500"
            fill="currentColor"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            /></svg
          >
        </div>
      </div>
    {/if}
  </div>
</div>
