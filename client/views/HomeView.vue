<script setup lang="ts">
import PostListComponent from "@/components/Post/PostListComponent.vue";
import LocationSetForm from "@/components/Travel/LocationForm.vue";
import LocationChangeForm from "@/components/Travel/changeLocationForm.vue";
import { useUserStore } from "@/stores/user";
import { useLocationStore } from "@/stores/location";
import { storeToRefs } from "pinia";

const { currentUsername, isLoggedIn } = storeToRefs(useUserStore());
const { currentLocation } = storeToRefs(useLocationStore());
</script>

<template>
  <main>
    <h1>Home Page</h1>
    <section>
      <h1 v-if="isLoggedIn">Welcome {{ currentUsername }}!</h1>
      <h1 v-else>Please login!</h1>
    </section>
    <section>
      <div v-if="isLoggedIn">
        <div v-if="currentLocation">
          <h2>Your current location: {{ currentLocation }}</h2>
          <LocationChangeForm />
        </div>
        <div v-else>
          <h2>Please set your location:</h2>
          <LocationSetForm />
        </div>
      </div>
    </section>
    <PostListComponent />
  </main>
</template>

<style scoped>
h1 {
  text-align: center;
}

h2 {
  text-align: center;
  margin-top: 1em;
}
</style>
