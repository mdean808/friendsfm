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
  import { getPlatformColor, goto } from "../lib";
  import Submission from "../components/Submission.svelte";

  // GLOBALS
  let currentLocation: string;
  let notifications: Notification[];

  // FUNCTIONS
  // const returnCurrentPosition = async () => {
  //   const reverseGeocode = await getReverseGeocode();
  //   return `${reverseGeocode.addresses[0].subAdministrativeArea}, ${reverseGeocode.addresses[0].administrativeArea}`;
  // };

  // ONMOUNT
  onMount(async () => {
    // request device permissions
    try {
      // await Geolocation.checkPermissions().catch(async () => await Geolocation.requestPermissions());
      // notifications = (await FirebaseMessaging.getDeliveredNotifications()).notifications
      // currentLocation = await returnCurrentPosition();
    } catch (e) {
      console.log("ERROR: ", JSON.stringify(e))
    }
  });
</script>

<div
  style={`height: ${55 + $statusBarHeight}px`}
  class={`top-0 bg-gray-900 left-0 fixed w-full `}
>
  <nav
    style={`margin-top: ${$statusBarHeight}px`}
    class={`w-full flex p-3  flex-row justify-between items-center text-${getPlatformColor(
      $user?.musicPlatform
    )}`}
  >
    <div class="flex-grow-0">
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
    <h1 class="text-center mx-auto text-3xl text-white flex-grow">FriendsFM</h1>
    <div class="flex-grow-0">
      <svg
        class="w-8 h-8"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
        ><path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
          clip-rule="evenodd"
        /></svg
      >
    </div>
  </nav>
</div>
<div
  style={`margin-top: ${10 + $statusBarHeight}px; margin-bottom: ${
    $bottomInset + 50
  }px`}
  class="text-center w-full"
>
  <div
    style={`height: calc(100vh - ${60 + $statusBarHeight}px - ${
      55 + $bottomInset
    }px)`}
    class="py-2 px-4 overflow-y-scroll"
  >
    <h2>Hello, {$user?.username}</h2>
    <h2>you prefer {$user?.musicPlatform}</h2>
    <p>Your current location is {currentLocation || "unknown"}.</p>
    <p>Your current notification token is</p><p>{$user?.messagingToken || "unknown"}</p>
    <p>Your Notifications include</p>
    {#if notifications}
      <div>
        {#each notifications as notification }
          <p>{notification.title}</p>
        {/each}
      </div>
    {/if}
    <Button
      type="primary"
      title="reset"
      on:click={() => {
        logout(); goto("/new_user");
      }}>Reset</Button
    >
      <div class="my-2">
      {#each $submissions as submission}
    <Submission data={submission}/>
      {/each}
    </div>
  </div>
</div>
