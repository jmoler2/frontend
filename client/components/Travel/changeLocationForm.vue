<script setup lang="ts">
import router from "@/router";
import { useLocationStore } from "@/stores/location";
import { ref } from "vue";

const location = ref("");
const { updateLocation, setUserLocation, updateSession } = useLocationStore();

async function setLocation() {
  await setUserLocation(location.value);
  void updateSession();
  void router.push({ name: "Home" });
}

async function changeUserLocation() {
  await updateLocation(location.value);
  void updateSession();
  void router.push({ name: "Home" });
}
</script>

<template>
  <form class="pure-form pure-form-aligned" @submit.prevent="changeUserLocation">
    <h3>Change Location</h3>
    <fieldset>
      <div class="pure-control-group">
        <label for="aligned-name">Location</label>
        <input v-model.trim="location" type="text" id="aligned-name" placeholder="Location" required />
      </div>
      <div class="pure-controls">
        <button type="submit" class="pure-button pure-button-primary">Change Location</button>
      </div>
    </fieldset>
  </form>
</template>

<style scoped>
h3 {
  display: flex;
  justify-content: center;
}
</style>
