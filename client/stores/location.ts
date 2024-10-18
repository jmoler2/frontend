import { defineStore } from "pinia";
import { ref } from "vue";

import { fetchy } from "@/utils/fetchy";

export const useLocationStore = defineStore(
  "location",
  () => {
    const currentLocation = ref("");

    const resetStore = () => {
      currentLocation.value = "";
    };

    const setUserLocation = async (location: string) => {
      await fetchy("/api/location", "POST", {
        body: { location },
      });
    };

    const updateSession = async () => {
      try {
        const { location } = await fetchy("/api/location", "GET", { alert: false });
        currentLocation.value = location;
      } catch {
        currentLocation.value = "";
      }
    };

    const updateLocation = async (location: string) => {
      await fetchy("/api/location", "PATCH", { body: { location } });
    };

    return {
      currentLocation,
      resetStore,
      setUserLocation,
      updateSession,
      updateLocation,
    };
  },
  { persist: true },
);
