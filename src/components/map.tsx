"use client";

import React from "react";
import { useJsApiLoader, GoogleMap } from "@react-google-maps/api";
import { geocodeByPlaceId } from "react-google-places-autocomplete";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAP_BOUNDS_RESTRICTION,
  MAP_ID,
  libraries,
} from "@/lib/types";
import PovToggle from "./pov-toggle";
import LocationSearchBox from "./location-search";
import ControlButton from "./control-button";
import ClientInfo, { ClientAvatar } from "./client-info";
import { useSocket } from "@/SocketProvider";

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

  const [currentController, setCurrentController] = React.useState<
    string | null
  >(null);
  const [inPano, setInPano] = React.useState(false);
  const [isFollowPov, setIsFollowPov] = React.useState(false);
  const [connectedClients, setConnectedClients] =
    React.useState<Record<string, string>>();

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const socket = useSocket();

  React.useEffect(() => {
    if (!socket) return;

    socket.connect();

    function updateMap(bounds: google.maps.LatLngBounds) {
      if (mapRef.current) {
        mapRef.current.fitBounds(bounds, 0);
      }
    }

    function onControlStatus(currentController: string | null) {
      setCurrentController(currentController);
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

    function onMarker(location: google.maps.LatLng) {
      handlePlaceMarker(location);
    }

    function onUpdatePov(pov: google.maps.StreetViewPov) {
      if (panoRef.current) {
        panoRef.current.setPov(pov);
      }
    }

    function onUpdateClients(clients: Record<string, string>) {
      setConnectedClients(clients);
    }

    socket.on("updateMap", updateMap);
    socket.on("controlStatus", onControlStatus);
    socket.on("panoramaVisible", onPanoramaVisible);
    socket.on("panoramaHidden", onPanoramaHidden);
    socket.on("updatePano", onUpdatePano);
    socket.on("marker", onMarker);
    socket.on("updatePov", onUpdatePov);
    socket.on("updateClients", onUpdateClients);

    return () => {
      socket.off("updateMap", updateMap);
      socket.off("controlStatus", onControlStatus);
      socket.off("panoramaVisible", onPanoramaVisible);
      socket.off("panoramaHidden", onPanoramaHidden);
      socket.off("updatePano", onUpdatePano);
      socket.off("marker", onMarker);
      socket.off("updatePov", onUpdatePov);
      socket.off("updateClients", onUpdateClients);
      socket.disconnect();
    };
  }, [socket]);

  const inControl = currentController === socket?.id;
  const isControlled =
    currentController !== null && currentController !== socket?.id;

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
            socket?.emit("panoramaVisible");
            setInPano(true);
          } else {
            socket?.emit("panoramaHidden");
            setInPano(false);
          }
        });

        panoRef.current.addListener("pano_changed", () => {
          const panoId = panoRef.current?.getPano();
          if (panoId) {
            socket?.emit("updatePano", panoId);
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
    [initialCenter, initialZoom, panoOptions, socket]
  );

  React.useEffect(() => {
    if (panoRef.current && isFollowPov) {
      const handlePovChanged = () => {
        const heading = panoRef.current?.getPov().heading;
        const pitch = panoRef.current?.getPov().pitch;
        if (heading && pitch) {
          const pov: google.maps.StreetViewPov = { heading, pitch };
          socket?.emit("updatePov", pov);
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
  }, [isFollowPov, socket]);

  const onUnmount = React.useCallback(() => {
    mapRef.current = null;
    panoRef.current = null;
  }, []);

  const handleMapChange = React.useCallback(() => {
    if (!inControl || !mapRef.current) return;
    const bounds = mapRef.current.getBounds();
    socket.emit("updateMap", bounds);
  }, [inControl, socket]);

  const handleControlClick = () => {
    if (!inControl) {
      socket?.emit("takeControl");
    } else {
      socket.emit("giveControl");
    }
  };

  const handlePlaceSelect = async (placeId: string) => {
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
      socket?.emit("marker", geometry.location);
    } catch (error) {
      console.error("Error getting location: ", error);
    }
  };

  const handlePlaceMarker = (position: google.maps.LatLng) => {
    if (markerRef.current) {
      markerRef.current.map = null;
    }
    markerRef.current = new google.maps.marker.AdvancedMarkerElement({
      map: mapRef.current,
      position,
    });
  };

  const MemoizedGoogleMap = React.useMemo(
    () => (
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
      />
    ),
    [onLoad, onUnmount, handleMapChange, inControl]
  );

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="size-full relative">
      {currentController === null && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30" />
      )}
      {MemoizedGoogleMap}
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
      {connectedClients &&
        currentController &&
        connectedClients[currentController] && (
          <div className="absolute z-10 left-1/2 -translate-x-1/2 bottom-20 flex flex-col items-center gap-1">
            <ClientAvatar
              name={connectedClients[currentController]}
              side="top"
              me={currentController === socket?.id}
            />
            <span className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded-full">
              Currently Controlling
            </span>
          </div>
        )}
      <ControlButton
        inControl={inControl}
        isControlled={isControlled}
        inPano={inPano}
        onControlClick={handleControlClick}
        className="absolute bottom-[24px] left-1/2 -translate-x-1/2 z-10"
      />
      {socket?.id && connectedClients && (
        <ClientInfo
          currentSocketId={socket.id}
          connectedClients={connectedClients}
          inPano={inPano}
          className="absolute right-[10px] top-[10px] z-10"
        />
      )}
    </div>
  );
}
