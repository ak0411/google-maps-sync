import React from "react";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";
import { twMerge } from "tailwind-merge";

type Props = {
  onPlaceSelect: (placeId: string) => Promise<void>;
  className?: string;
};

function LocationSearchBox({ onPlaceSelect, className }: Props) {
  return (
    <div className={twMerge(`h-[40px] w-11/12 sm:w-[500px]`, className)}>
      <GooglePlacesAutocomplete
        selectProps={{
          onChange: async (newValue) => {
            if (newValue?.value?.place_id) {
              await onPlaceSelect(newValue.value.place_id);
            }
          },
        }}
      />
    </div>
  );
}

export default LocationSearchBox;
