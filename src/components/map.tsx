"use client";

import React, { useEffect } from "react";
import { useJsApiLoader, GoogleMap } from "@react-google-maps/api";
import { socket } from "@/socket";
import { Button } from "./ui/button";

export default function Map() {
  const mapRef = React.useRef<google.maps.Map>(null);
  const [inControl, setInControl] = React.useState(false);
  const [mapState, setMapState] = React.useState({
    center: { lat: 0, lng: 0 },
    zoom: 3,
  });

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
  });

  useEffect(() => {
    function onMove(bounds: google.maps.LatLngBounds) {
      mapRef.current?.fitBounds(bounds);
    }

    function onControl(control: boolean) {
      setInControl(control);
    }

    socket.on("move", onMove);
    socket.on("control", onControl);

    return () => {
      socket.off("move", onMove);
      socket.off("control", onControl);
    };
  }, []);

  const onLoad = React.useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      mapRef.current.setCenter(mapState.center);
      mapRef.current.setZoom(mapState.zoom);
    },
    [mapState]
  );

  const onUnmount = React.useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleMove = React.useCallback(() => {
    if (inControl) {
      const center = mapRef.current?.getCenter();
      const zoom = mapRef.current?.getZoom();
      if (center && zoom !== undefined) {
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
        }}
      >
        <Button
          className="absolute z-10 bottom-4 left-1/2 -translate-x-1/2"
          onClick={handleControl}
        >
          {inControl ? "Relinquish Control" : "Take Control"}
        </Button>
      </GoogleMap>
    );
  }, [
    handleControl,
    handleMove,
    inControl,
    isLoaded,
    loadError,
    onLoad,
    onUnmount,
  ]);
}
