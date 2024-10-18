<script setup lang="ts">
import PostListComponent from "@/components/Post/PostListComponent.vue";
import LocationForm from "@/components/Travel/LocationForm.vue";
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
      <h1 v-if="isLoggedIn">
        <LocationForm />
        Your location: {{ currentLocation }}
      </h1>
    </section>
    <PostListComponent />
  </main>
</template>

<style scoped>
h1 {
  text-align: center;
}
</style>
