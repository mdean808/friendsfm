<script lang="ts">
  import { onMount } from 'svelte';
  import AutoComplete from 'simple-svelte-autocomplete';
  import {
    audialTracks,
    audialAttempt,
    audialAnswer,
    setSubmissionAudial,
    audialSongPaused,
  } from '$lib/audial';
  import { spotifyTrackToAudialSong } from '$lib/audial';
  import type {
    AudialAttempt,
    AudialGuess,
    AudialSong,
  } from '$lib/types/audial';
  import type { SpotifyTrack } from '$lib/types/friendsfm';
  import Button from '$components/Button.svelte';
  import GameEnd from '$components/audial/GameEnd.svelte';
  import { Dialog } from '@capacitor/dialog';
  import { userSubmission } from '$lib/submission';
  import LoadingIndicator from '$components/LoadingIndicator.svelte';

  onMount(async () => {
    // if we are in a new date from the past, take the new random song and set it to the current one.
    //    reset the attempts.
    if (
      !$audialAttempt ||
      new Date($audialAttempt.date).toLocaleDateString() !==
        new Date().toLocaleDateString()
    ) {
      audialAttempt.set(<AudialAttempt>{
        guesses: [],
        date: new Date(),
        correct: false,
        attempts: 0,
        type: 'default',
      });
    } else {
      audialAttempt.update((a) => ({ ...a, type: 'default' }));
    }
  });
  let currentSelectedSong = <AudialSong | null>{};

  const chooseSong = async () => {
    audialSongPaused.set(true);
    if (!currentSelectedSong || !currentSelectedSong.id) {
      Dialog.alert({ message: 'Please select a valid song from the list.' });
      return;
    }
    const guesses = [...($audialAttempt.guesses || [])];
    // correct guess
    if (currentSelectedSong.id === $audialAnswer.id) {
      guesses.push(<AudialGuess>{
        song: currentSelectedSong,
        correct: true,
        artistCorrect: true,
      });
      audialAttempt.update((a) => ({
        ...a,
        guesses,
        correct: true,
        attempts: a.attempts + 1,
      }));
      // save correct attempt to submission (submision should always be defined since we do a check in the root)
      await setSubmissionAudial($userSubmission!, $audialAttempt!);
    } else {
      // incorrect guess
      const track = $audialTracks.find((t) => t.id == currentSelectedSong?.id);
      if (track) {
        guesses.push(<AudialGuess>{
          song: spotifyTrackToAudialSong(track),
          correct: false,
          artistCorrect: !!$audialAnswer.artists.find(
            (a) => a.name === currentSelectedSong?.artist
          ),
        });
      }
      audialAttempt.update((a) => ({
        ...a,
        guesses,
        attempts: a.attempts + 1,
      }));
    }
    if ($audialAttempt.attempts === 6 && !$audialAttempt.correct) {
      await setSubmissionAudial($userSubmission!, $audialAttempt!);
    }
    currentSelectedSong = null;
  };

  const skipSong = () => {
    const guesses = [...($audialAttempt.guesses || [])];
    guesses.push(<AudialGuess>{
      song: null,
      correct: false,
      artistCorrect: false,
    });
    audialAttempt.update((a) => ({
      ...a!,
      guesses,
      attempts: a.attempts + 1,
    }));
  };

  const searchSongs = async (query: string) => {
    let searchResults: SpotifyTrack[] | AudialSong[] = $audialTracks.filter(
      (t) => {
        return (t.name + ' ' + t.artists[0].name)
          .toLowerCase()
          .includes(query.toLowerCase());
      }
    );
    searchResults = searchResults.map((t) => spotifyTrackToAudialSong(t));
    searchResults = searchResults.map(
      (s) =>
        <AudialSong>{
          name: s.name + ' by ' + s.artist,
          id: s.id,
          artist: s.artist,
          preview: s.preview,
        }
    );
    return searchResults;
  };
</script>

{#if !$audialAttempt}
  <LoadingIndicator />
{:else}
  <div>
    <!-- PLAYLIST/GENRE TITLE -->
    {#if $audialAttempt.attempts === 0}
      <div class="w-full px-0 sm:px-20 transition-all duration-200">
        <p class="text-center mx-auto w-full text-blue-100">
          listen to the song and try to guess it correctly.
        </p>
        <p class="text-center mx-auto w-full text-blue-100">
          you have 6 attempts.
        </p>
      </div>
    {/if}
    <!-- GUESSES -->
    <div class="w-full px-0 transition-all sm:px-20 items-center game">
      {#if $audialAttempt.guesses}
        {#each $audialAttempt.guesses.filter((g) => !g.correct) as guess}
          {#if guess.song}
            <div
              title="Open in Spotify"
              role="button"
              tabindex="0"
              on:click={() => {
                window.location.href = `https://open.spotify.com/track/${guess.song?.id}`;
              }}
              on:keypress={() => {
                window.location.href = `https://open.spotify.com/track/${guess.song?.id}`;
              }}
              class={`cursor-pointer ${
                guess.artistCorrect ? 'border-amber-400' : 'border-red-600'
              } border-2 h-10 p-2 my-2 w-full text-left rounded-sm bg-gray-900 overflow-ellipsis whitespace-nowrap overflow-hidden`}
            >
              {guess.song.name} by {guess.song.artist}
            </div>
          {:else}
            <div
              class={`border-gray-600 border-2 h-10 p-2 my-2 w-full text-left rounded-sm bg-gray-900 overflow-ellipsis whitespace-nowrap overflow-hidden`}
            >
              song guess skipped
            </div>
          {/if}
        {/each}
        {#each $audialAttempt.guesses.filter((g) => g.correct) as guess}
          <div
            title="Open in Spotify"
            role="button"
            tabindex="0"
            on:click={() => {
              window.location.href = `https://open.spotify.com/track/${guess.song?.id}`;
            }}
            on:keypress={() => {
              window.location.href = `https://open.spotify.com/track/${guess.song?.id}`;
            }}
            class="cursor-pointer border-green-600 border-2 h-10 p-2 my-2 w-full text-left rounded-sm bg-gray-900 overflow-ellipsis whitespace-nowrap overflow-hidden"
          >
            <!-- guess.song is defined since we sorted by correct guesses -->
            {guess.song?.name} by {guess.song?.artist}
          </div>
        {/each}
      {/if}
      {#if $audialAttempt.attempts < 6 && !$audialAttempt.correct}
        <div class="flex mt-6 mb-2" title="guess a song">
          <AutoComplete
            name="song-selection"
            className="w-10/12"
            inputClassName="border-gray-600 border-2 w-full h-8 px-2 py-5 rounded-sm bg-gray-900 hover:border-gray-400 focus:border-gray-400 outline-none transition-all duration-200"
            dropdownClassName="p-0 bg-gray-900"
            placeholder={`${6 - $audialAttempt.attempts} ${
              6 - $audialAttempt.attempts !== 1 ? 'attempts' : 'attempt'
            } left`}
            minCharactersToSearch={2}
            searchFunction={searchSongs}
            bind:selectedItem={currentSelectedSong}
            labelFieldName="name"
            valueFieldName="id"
            showLoadingIndicator
            noInputStyles
            hideArrow
          >
            <div
              slot="item"
              let:item
              class="border-2 h-10 px-2 py-3 w-full text-left rounded-sm bg-gray-900 text-white hover:text-blue-500 hover:border-blue-500 overflow-ellipsis whitespace-nowrap overflow-hidden transition-colors duration-150"
            >
              <span>{item.name}</span>
            </div>
            <div slot="no-results" class="py-1">
              <span>could not find this song in the playlist.</span>
            </div>
            <div slot="loading" class="py-1">
              <span>searching for songs...</span>
            </div>
          </AutoComplete>
          <div class="w-2/12 pl-2 mt-0.5" title="guess selected song">
            <Button
              title="Submit Song Guess"
              type="primary"
              className="w-full rounded-lg"
              on:click={chooseSong}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Button>
            <div
              class="text-gray-400 cursor-pointer text-center underline underline-offset-1"
              on:click={skipSong}
              on:keypress={skipSong}
              role="button"
              tabindex="0"
            >
              skip
            </div>
          </div>
        </div>
      {:else}
        <GameEnd />
      {/if}
    </div>
  </div>
{/if}
