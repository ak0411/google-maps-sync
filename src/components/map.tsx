"use client";

import React, { useEffect, useMemo } from "react";
import { useJsApiLoader, GoogleMap } from "@react-google-maps/api";
import { socket } from "@/socket";
import { Button } from "./ui/button";

export default function Map() {
  const mapRef = React.useRef<google.maps.Map>(null);
  const panoRef = React.useRef<google.maps.StreetViewPanorama>(null);
  const [inControl, setInControl] = React.useState(false);
  const [isControlled, setIsControlled] = React.useState(false);
  const [mapState, setMapState] = React.useState({
    center: { lat: 59.64372637586483, lng: 17.08156655575136 },
    zoom: 17,
  });

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
  });

  useEffect(() => {
    function onMove(bounds: google.maps.LatLngBounds) {
      mapRef.current?.fitBounds(bounds);
    }

    function onControlStatus(status: {
      isControlled: boolean;
      controllerId: string | null;
    }) {
      setIsControlled(status.isControlled);
      setInControl(status.controllerId === socket.id);
    }

    function onPanoramaVisible(panoId: string) {
      if (panoRef.current) {
        panoRef.current.setPano(panoId);
        panoRef.current.setVisible(true);
      }
    }

    function onPanoramaHidden() {
      if (panoRef.current) {
        panoRef.current.setVisible(false);
      }
    }

    socket.on("move", onMove);
    socket.on("controlStatus", onControlStatus);
    socket.on("panoramaVisible", onPanoramaVisible);
    socket.on("panoramaHidden", onPanoramaHidden);

    return () => {
      socket.off("move", onMove);
      socket.off("controlStatus", onControlStatus);
      socket.off("panoramaVisible", onPanoramaVisible);
      socket.on("panoramaHidden", onPanoramaHidden);
    };
  }, []);

  const panoOptions: google.maps.StreetViewPanoramaOptions = useMemo(
    () => ({
      disableDefaultUI: true,
      panControl: true,
      zoomControl: true,
      addressControl: true,
      clickToGo: inControl,
      linksControl: inControl,
    }),
    [inControl]
  );

  useEffect(() => {
    if (panoRef.current) {
      panoRef.current.setOptions(panoOptions);
    }
  }, [inControl, panoOptions]);

  const onLoad = React.useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      mapRef.current.setCenter(mapState.center);
      mapRef.current.setZoom(mapState.zoom);

      panoRef.current = map.getStreetView();
      panoRef.current.setOptions(panoOptions);

      if (panoRef.current) {
        console.log("StreetViewPanorama initialized");

        // Add event listener for visible_changed
        panoRef.current.addListener("visible_changed", () => {
          console.log("visible_changed event triggered");
          if (panoRef.current?.getVisible()) {
            const panoId = panoRef.current.getPano();
            console.log("Panorama is visible with pano id:", panoId);
            socket.emit("panoramaVisible", panoId);
          } else {
            console.log("hide panorama");
            // Emit an event when the panorama becomes invisible
            socket.emit("panoramaHidden");
          }
        });
      } else {
        console.error("Failed to initialize StreetViewPanorama");
      }
    },
    [mapState.center, mapState.zoom, panoOptions]
  );

  const onUnmount = React.useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleMove = React.useCallback(() => {
    if (inControl) {
      const center = mapRef.current?.getCenter();
      const zoom = mapRef.current?.getZoom();
      if (center && zoom) {
        setMapState({
          center: { lat: center.lat(), lng: center.lng() },
          zoom,
        });
        socket.emit("move", mapRef.current?.getBounds());
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

  return React.useMemo(() => {
    if (loadError) return <div>Error loading maps</div>;
    if (!isLoaded) return <div>Loading...</div>;

    return (
      <GoogleMap
        onLoad={onLoad}
        onUnmount={onUnmount}
        onDragEnd={handleMove}
        onZoomChanged={handleMove}
        mapContainerStyle={{
          height: "100vh",
          width: "100%",
        }}
        options={{
          minZoom: 2,
          fullscreenControl: false,
          restriction: {
            latLngBounds: {
              north: 85,
              south: -85,
              west: -180,
              east: 180,
            },
            strictBounds: false,
          },
          gestureHandling: inControl ? "auto" : "none",
          streetViewControl: inControl,
          zoomControl: inControl,
          keyboardShortcuts: false,
        }}
      >
        <Button
          className="absolute z-10 bottom-4 left-1/2 -translate-x-1/2"
          variant={inControl ? "destructive" : "default"}
          onClick={handleControl}
          disabled={isControlled && !inControl}
        >
          {inControl ? "Give Control" : "Take Control"}
        </Button>
      </GoogleMap>
    );
  }, [
    handleControl,
    handleMove,
    inControl,
    isControlled,
    isLoaded,
    loadError,
    onLoad,
    onUnmount,
  ]);
}
