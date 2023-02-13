<script lang="ts">
  // IMPORTS
  import { onMount } from "svelte";
  // import { Geolocation } from "@capacitor/geolocation";
  // import { FirebaseMessaging, type Notification } from "@capacitor-firebase/messaging";
  import {
    user,
    logout,
    statusBarHeight,
    // getReverseGeocode,
    bottomInset,
    submissions,
  } from "../store";
  import Button from "../components/Button.svelte";
  import { goto } from "../lib";
  import Submission from "../components/Submission.svelte";

  // GLOBALS


  // ONMOUNT
  onMount(async () => {
    //TODO: load submissions!
  });
</script>

<div
  style={`margin-top: ${8 + $statusBarHeight}px; margin-bottom: ${
    $bottomInset + 50
  }px`}
  class="text-center w-full"
>
  <div
    style={`height: calc(100vh - ${60 + $statusBarHeight}px - ${
      55 + $bottomInset
    }px)`}
    class="py-2 px-4 overflow-y-scroll overflow-x-hidden"
  >
    <h2>Hello, {$user?.username}!</h2>
    <Button
      type="primary"
      title="reset"
      on:click={() => {
        logout(); goto("/new_user");
      }}>Reset</Button
    >
      <div class="my-2">
        {#if !$submissions.length}
          <h3>Looks like you're the only one listening right now!</h3>
        {:else}
          {#each $submissions as submission}
            <Submission data={submission}/>
          {/each}
      {/if}
    </div>
  </div>
</div>
