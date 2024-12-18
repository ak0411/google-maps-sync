"use client";

import React, { useEffect, useMemo } from "react";
import { useJsApiLoader, GoogleMap } from "@react-google-maps/api";
import { socket } from "@/socket";
import { Button } from "./ui/button";
import { Users } from "lucide-react";

type MapState = {
  center: google.maps.LatLngLiteral;
  zoom: number;
};

type ControlStatus = {
  isControlled: boolean;
  controllerId: string | null;
};

export default function Map() {
  const mapRef = React.useRef<google.maps.Map>(null);
  const panoRef = React.useRef<google.maps.StreetViewPanorama>(null);
  const [inControl, setInControl] = React.useState(false);
  const [isControlled, setIsControlled] = React.useState(false);
  const [mapState, setMapState] = React.useState<MapState>({
    center: { lat: 59.64372637586483, lng: 17.08156655575136 },
    zoom: 17,
  });
  const [onlineClients, setOnlineClients] = React.useState(0);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
  });

  useEffect(() => {
    console.log("Map component mounted");

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
      }
    }

    function onPanoramaHidden() {
      if (panoRef.current) {
        panoRef.current.setVisible(false);
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

    socket.on("updateMap", updateMap);
    socket.on("controlStatus", onControlStatus);
    socket.on("panoramaVisible", onPanoramaVisible);
    socket.on("panoramaHidden", onPanoramaHidden);
    socket.on("updatePano", onUpdatePano);
    socket.on("onlineClients", onOnlineClients);

    return () => {
      socket.off("updateMap", updateMap);
      socket.off("controlStatus", onControlStatus);
      socket.off("panoramaVisible", onPanoramaVisible);
      socket.off("panoramaHidden", onPanoramaHidden);
      socket.off("updatePano", onUpdatePano);
      socket.off("onlineClients", onOnlineClients);
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
      enableCloseButton: inControl,
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
      panoRef.current = map.getStreetView();
      panoRef.current.setOptions(panoOptions);

      if (panoRef.current) {
        panoRef.current.addListener("visible_changed", () => {
          if (panoRef.current?.getVisible()) {
            socket.emit("panoramaVisible");
          } else {
            socket.emit("panoramaHidden");
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

  const onUnmount = React.useCallback(() => {
    mapRef.current = null;
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
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-lg shadow-lg"
          variant={inControl ? "destructive" : "outline"}
          onClick={handleControl}
          disabled={isControlled && !inControl}
        >
          {inControl ? "Give Control" : "Take Control"}
        </Button>
        <div className="absolute right-4 top-4 shadow-md flex">
          <Button variant="secondary" className="h-[40px] text-lg">
            {onlineClients}
          </Button>
          <Button variant="outline" className="h-[40px]">
            <Users />
          </Button>
        </div>
      </GoogleMap>
    );
  }, [
    handleControl,
    handleUpdateMap,
    inControl,
    isControlled,
    isLoaded,
    loadError,
    mapState.center,
    mapState.zoom,
    onLoad,
    onUnmount,
    onlineClients,
  ]);
}
