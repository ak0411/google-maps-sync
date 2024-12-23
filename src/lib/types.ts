import { Libraries } from "@react-google-maps/api";

export const DEFAULT_CENTER = {
  lat: 59.64372637586483,
  lng: 17.08156655575136,
};
export const DEFAULT_ZOOM = 17;
export const MAP_ID = "4cc7186171a056a2";

export const MAP_BOUNDS_RESTRICTION = {
  latLngBounds: {
    north: 85,
    south: -85,
    west: -180,
    east: 180,
  },
  strictBounds: false,
};

export const libraries: Libraries = ["places", "marker"];
