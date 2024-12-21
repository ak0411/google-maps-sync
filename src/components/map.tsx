"use client";

import React from "react";
import { useJsApiLoader, GoogleMap } from "@react-google-maps/api";
import { socket } from "@/socket";
import { geocodeByPlaceId } from "react-google-places-autocomplete";
import {
  type ControlStatus,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAP_BOUNDS_RESTRICTION,
  MAP_ID,
  libraries,
} from "@/lib/types";
import PovToggle from "./pov-toggle";
import LocationSearchBox from "./location-search";
import ControlButton from "./control-button";
import ClientInfo from "./client-info";

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
      if (mapRef.current) {
        mapRef.current.fitBounds(bounds, 0);
      }
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
      handlePlaceMarker(location);
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
      mapRef.current.setCenter(initialCenter);
      mapRef.current.setZoom(initialZoom);

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
            mapRef.current?.setCenter(position);
          }
        });
      }
    },
    [initialCenter, initialZoom, panoOptions]
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

  const handleMapChange = React.useCallback(() => {
    if (!inControl || !mapRef.current) return;
    const bounds = mapRef.current.getBounds();
    socket.emit("updateMap", bounds);
  }, [inControl]);

  const handleControlClick = React.useCallback(() => {
    if (!inControl) {
      socket.emit("takeControl");
    } else {
      socket.emit("giveControl");
    }
  }, [inControl]);

  const handlePlaceSelect = React.useCallback(async (placeId: string) => {
    if (!mapRef.current) return;

    try {
      const results = await geocodeByPlaceId(placeId);
      const geometry = results[0].geometry;

      if (geometry.bounds) {
        mapRef.current.fitBounds(geometry.bounds);
      } else {
        mapRef.current.setCenter(geometry.location);
        mapRef.current.setZoom(17);
      }
      handlePlaceMarker(geometry.location);
      socket.emit("marker", geometry.location);
    } catch (error) {
      console.error("Error getting location: ", error);
    }
  }, []);

  const handlePlaceMarker = (position: google.maps.LatLng) => {
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
        onLoad={onLoad}
        onUnmount={onUnmount}
        onTilesLoaded={handleMapChange}
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
          <LocationSearchBox
            onPlaceSelect={handlePlaceSelect}
            className="absolute top-[100px] lg:top-[10px] left-1/2 -translate-x-1/2"
          />
        )}
        {inControl && inPano && (
          <PovToggle
            isFollowPov={isFollowPov}
            setIsFollowPov={setIsFollowPov}
            className="absolute bottom-[24px] right-[60px] z-10"
          />
        )}
        <ControlButton
          inControl={inControl}
          inPano={inPano}
          isControlled={isControlled}
          onControlClick={handleControlClick}
          className="absolute bottom-[24px] left-1/2 -translate-x-1/2 z-10"
        />
        <ClientInfo
          count={onlineClients}
          inPano={inPano}
          className="absolute right-[10px] top-[10px] z-10"
        />
      </GoogleMap>
    );
  }, [
    loadError,
    isLoaded,
    onLoad,
    onUnmount,
    handleMapChange,
    inControl,
    inPano,
    handlePlaceSelect,
    isFollowPov,
    handleControlClick,
    isControlled,
    onlineClients,
  ]);
}
