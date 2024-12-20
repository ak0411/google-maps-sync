"use client";

import React from "react";
import { useJsApiLoader, GoogleMap } from "@react-google-maps/api";
import { Button } from "./ui/button";
import { Users } from "lucide-react";
import { socket } from "@/socket";
import GooglePlacesAutocomplete, {
  geocodeByPlaceId,
} from "react-google-places-autocomplete";
import {
  type ControlStatus,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAP_BOUNDS_RESTRICTION,
  MAP_ID,
  type MapState,
  libraries,
} from "@/lib/types";
import PovToggle from "./pov-toggle";

export type MapProps = {
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
};

export default function Map({
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
}: MapProps) {
  const mapRef = React.useRef<google.maps.Map>(null);
  const panoRef = React.useRef<google.maps.StreetViewPanorama>(null);
  const markerRef =
    React.useRef<google.maps.marker.AdvancedMarkerElement>(null);

  const [mapState, setMapState] = React.useState<MapState>({
    center: initialCenter,
    zoom: initialZoom,
  });
  const [inControl, setInControl] = React.useState(false);
  const [isControlled, setIsControlled] = React.useState(false);
  const [inPano, setInPano] = React.useState(false);
  const [isFollowPov, setIsFollowPov] = React.useState(false);
  const [onlineClients, setOnlineClients] = React.useState(1);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  React.useEffect(() => {
    socket.connect();

    function updateMap(bounds: google.maps.LatLngBounds) {
      mapRef.current?.fitBounds(bounds);
    }

    function onControlStatus(status: ControlStatus) {
      setIsControlled(status.isControlled);
      setInControl(status.controllerId === socket.id);
    }

    function onPanoramaVisible() {
      if (panoRef.current) {
        panoRef.current.setVisible(true);
        setInPano(true);
      }
    }

    function onPanoramaHidden() {
      if (panoRef.current) {
        panoRef.current.setVisible(false);
        setInPano(false);
      }
    }

    function onUpdatePano(panoId: string) {
      if (panoRef.current) {
        panoRef.current.setPano(panoId);
      }
    }

    function onOnlineClients(onlineClients: number) {
      setOnlineClients(onlineClients);
    }

    function onMarker(location: google.maps.LatLng) {
      placeMarker(location);
    }

    function onUpdatePov(pov: google.maps.StreetViewPov) {
      if (panoRef.current) {
        panoRef.current.setPov(pov);
      }
    }

    socket.on("updateMap", updateMap);
    socket.on("controlStatus", onControlStatus);
    socket.on("panoramaVisible", onPanoramaVisible);
    socket.on("panoramaHidden", onPanoramaHidden);
    socket.on("updatePano", onUpdatePano);
    socket.on("onlineClients", onOnlineClients);
    socket.on("marker", onMarker);
    socket.on("updatePov", onUpdatePov);

    return () => {
      socket.off("updateMap", updateMap);
      socket.off("controlStatus", onControlStatus);
      socket.off("panoramaVisible", onPanoramaVisible);
      socket.off("panoramaHidden", onPanoramaHidden);
      socket.off("updatePano", onUpdatePano);
      socket.off("onlineClients", onOnlineClients);
      socket.off("marker", onMarker);
      socket.off("updatePov", onUpdatePov);
      socket.disconnect();
    };
  }, []);

  const panoOptions: google.maps.StreetViewPanoramaOptions = React.useMemo(
    () => ({
      disableDefaultUI: true,
      panControl: true,
      zoomControl: true,
      addressControl: true,
      clickToGo: inControl,
      linksControl: inControl,
      enableCloseButton: inControl,
    }),
    [inControl]
  );

  React.useEffect(() => {
    if (panoRef.current) {
      panoRef.current.setOptions(panoOptions);
    }
  }, [inControl, panoOptions]);

  const onLoad = React.useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      panoRef.current = map.getStreetView();
      panoRef.current.setOptions(panoOptions);

      if (panoRef.current) {
        panoRef.current.addListener("visible_changed", () => {
          if (panoRef.current?.getVisible()) {
            socket.emit("panoramaVisible");
            setInPano(true);
          } else {
            socket.emit("panoramaHidden");
            setInPano(false);
          }
        });

        panoRef.current.addListener("pano_changed", () => {
          const panoId = panoRef.current?.getPano();
          if (panoId) {
            socket.emit("updatePano", panoId);
          }
        });

        panoRef.current.addListener("position_changed", () => {
          const position = panoRef.current?.getPosition();
          if (position) {
            setMapState((prev) => ({
              ...prev,
              center: {
                lat: position.lat(),
                lng: position.lng(),
              },
            }));
          }
        });
      }
    },
    [panoOptions]
  );

  React.useEffect(() => {
    if (panoRef.current && isFollowPov) {
      const handlePovChanged = () => {
        const heading = panoRef.current?.getPov().heading;
        const pitch = panoRef.current?.getPov().pitch;
        if (heading && pitch) {
          const pov: google.maps.StreetViewPov = { heading, pitch };
          socket.emit("updatePov", pov);
        }
      };

      const povChangedListener = panoRef.current.addListener(
        "pov_changed",
        handlePovChanged
      );

      return () => {
        if (povChangedListener) {
          google.maps.event.removeListener(povChangedListener);
        }
      };
    }
  }, [isFollowPov]);

  const onUnmount = React.useCallback(() => {
    mapRef.current = null;
    panoRef.current = null;
  }, []);

  const handleUpdateMap = React.useCallback(() => {
    if (inControl) {
      const center = mapRef.current?.getCenter();
      const zoom = mapRef.current?.getZoom();
      if (center && zoom) {
        setMapState({
          center: { lat: center.lat(), lng: center.lng() },
          zoom,
        });
        socket.emit("updateMap", mapRef.current?.getBounds());
      }
    }
  }, [inControl]);

  const handleControl = React.useCallback(() => {
    if (!inControl) {
      socket.emit("takeControl");
    } else {
      socket.emit("giveControl");
    }
  }, [inControl]);

  const placeMarker = (position: google.maps.LatLng) => {
    if (markerRef.current) {
      markerRef.current.map = null;
    }
    markerRef.current = new google.maps.marker.AdvancedMarkerElement({
      map: mapRef.current,
      position,
    });
  };

  return React.useMemo(() => {
    if (loadError) return <div>Error loading maps</div>;
    if (!isLoaded) return <div>Loading...</div>;

    return (
      <GoogleMap
        center={mapState.center}
        zoom={mapState.zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onDragEnd={handleUpdateMap}
        onZoomChanged={handleUpdateMap}
        mapContainerStyle={{
          height: "100vh",
          width: "100%",
        }}
        options={{
          mapId: MAP_ID,
          minZoom: 2,
          fullscreenControl: false,
          restriction: MAP_BOUNDS_RESTRICTION,
          gestureHandling: inControl ? "auto" : "none",
          streetViewControl: inControl,
          zoomControl: inControl,
          keyboardShortcuts: false,
        }}
      >
        {inControl && !inPano && (
          <div className="absolute top-[100px] lg:top-[10px] h-[40px] left-1/2 -translate-x-1/2 w-11/12 sm:w-[500px]">
            <GooglePlacesAutocomplete
              selectProps={{
                onChange: async (newValue) => {
                  if (newValue && newValue.value && mapRef.current) {
                    try {
                      const results = await geocodeByPlaceId(
                        newValue.value.place_id
                      );
                      const geometry = results[0].geometry;

                      if (geometry.bounds) {
                        mapRef.current.fitBounds(geometry.bounds);
                      } else {
                        mapRef.current.setCenter(geometry.location);
                        mapRef.current.setZoom(17);
                      }
                      placeMarker(geometry.location);
                      socket.emit("marker", geometry.location);
                    } catch (error) {
                      console.error("Error getting location: ", error);
                    }
                  }
                },
              }}
            />
          </div>
        )}
        {inControl && inPano && (
          <PovToggle
            isFollowPov={isFollowPov}
            setIsFollowPov={setIsFollowPov}
            className="absolute bottom-[24px] right-[60px] z-10"
          />
        )}
        <Button
          className={`absolute bottom-[24px] h-[40px] left-1/2 -translate-x-1/2 text-lg font-normal z-10 ${
            inPano && "dark text-white"
          }`}
          variant={inControl ? "destructive" : "outline"}
          onClick={handleControl}
          disabled={isControlled && !inControl}
        >
          {inControl ? "Give Control" : "Take Control"}
        </Button>
        <div className="absolute right-[10px] top-[10px] shadow-md flex z-10">
          <Button
            variant="secondary"
            className={`h-[40px] text-lg ${inPano && "dark opacity-85"}`}
          >
            {onlineClients}
          </Button>
          <Button
            variant="outline"
            className={`h-[40px] ${inPano && "dark text-white opacity-85"}`}
          >
            <Users />
          </Button>
        </div>
      </GoogleMap>
    );
  }, [
    handleControl,
    handleUpdateMap,
    inControl,
    inPano,
    isControlled,
    isLoaded,
    isFollowPov,
    loadError,
    mapState.center,
    mapState.zoom,
    onLoad,
    onUnmount,
    onlineClients,
  ]);
}
