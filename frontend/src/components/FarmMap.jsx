
import { useMemo, useRef, useState } from "react";

import Map from "react-map-gl/mapbox";

import { DeckGL } from "@deck.gl/react";
import { GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";

import { area } from "@turf/area";
import { polygon } from "@turf/helpers";

import "mapbox-gl/dist/mapbox-gl.css";

const INITIAL_VIEW_STATE = {
  longitude: 78.01,
  latitude: 17.01,
  zoom: 13,
  pitch: 0,
  bearing: 0
};

// Check whether a point is inside the farm polygon
function isPointInsidePolygon(point, polygonPoints) {
  const [x, y] = point;
  let inside = false;

  for (
    let i = 0, j = polygonPoints.length - 1;
    i < polygonPoints.length;
    j = i++
  ) {
    const [xi, yi] = polygonPoints[i];
    const [xj, yj] = polygonPoints[j];

    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function FarmMap({ farmData, setFarmData }) {
  const mapRef = useRef(null);
  const dragRef = useRef(null);

  const [selectedFarm, setSelectedFarm] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Current farm boundary
  const ring = farmData.features[0].geometry.coordinates[0];

  // Calculate farm area in acres
  const acreage = area(polygon([ring])) / 4046.8564224;

  // Calculate approximate center coordinates
  const coordinates = ring.slice(0, -1);

  const centerLatitude =
    coordinates.reduce((sum, point) => sum + point[1], 0) /
    coordinates.length;

  const centerLongitude =
    coordinates.reduce((sum, point) => sum + point[0], 0) /
    coordinates.length;

  // Create Deck.gl layers
  const layers = useMemo(() => {
    const currentRing =
      farmData.features[0].geometry.coordinates[0];

    const vertices = currentRing.slice(0, -1).map(
      (position, index) => ({
        position,
        index
      })
    );

    return [
      new GeoJsonLayer({
        id: "farm-boundary",
        data: farmData,
        filled: true,
        stroked: true,
        getFillColor: [46, 125, 50, 45],
        getLineColor: [46, 160, 67, 255],
        getLineWidth: 3,
        lineWidthMinPixels: 2,
        pickable: true
      }),

      new ScatterplotLayer({
        id: "farm-edit-handles",
        data: vertices,
        getPosition: d => d.position,
        getRadius: 7,
        radiusUnits: "pixels",
        getFillColor: [255, 255, 255, 255],
        getLineColor: [46, 160, 67, 255],
        lineWidthMinPixels: 2,
        stroked: true,
        pickable: false
      })
    ];
  }, [farmData]);

  // Get mouse position relative to the map
  function getMapCoordinates(event) {
    const map = mapRef.current?.getMap();

    if (!map) return null;

    const rect = event.currentTarget.getBoundingClientRect();

    return {
      map,
      pixel: [
        event.clientX - rect.left,
        event.clientY - rect.top
      ]
    };
  }

  // Start moving the farm or resizing a corner
  function handlePointerDown(event) {
    if (event.button !== 0) return;

    const result = getMapCoordinates(event);

    if (!result) return;

    const { map, pixel } = result;

    const projectedVertices = ring
      .slice(0, -1)
      .map(position => {
        const point = map.project(position);

        return [point.x, point.y];
      });

    // Check if a corner handle was selected
    const vertexIndex = projectedVertices.findIndex(([x, y]) => {
      const distance = Math.hypot(
        pixel[0] - x,
        pixel[1] - y
      );

      return distance < 14;
    });

    const clickedCoordinate = map.unproject(pixel);

    if (vertexIndex !== -1) {

      // Resize individual corner
      dragRef.current = {
        type: "vertex",
        vertexIndex,
        originalRing: ring.map(position => [...position])
      };

    } else if (
      isPointInsidePolygon(pixel, projectedVertices)
    ) {

      // Move entire farm
      dragRef.current = {
        type: "polygon",
        startCoordinate: [
          clickedCoordinate.lng,
          clickedCoordinate.lat
        ],
        originalRing: ring.map(position => [...position])
      };

      setSelectedFarm(true);

    } else {
      return;
    }

    map.dragPan.disable();

    setIsDragging(true);

    event.currentTarget.setPointerCapture(event.pointerId);

    event.preventDefault();
  }

  // Update farm boundary while dragging
  function handlePointerMove(event) {
    if (!dragRef.current) return;

    const result = getMapCoordinates(event);

    if (!result) return;

    const { map, pixel } = result;

    const current = map.unproject(pixel);

    const drag = dragRef.current;

    const newRing = drag.originalRing.map(position => [
      ...position
    ]);

    if (drag.type === "vertex") {

      const index = drag.vertexIndex;

      newRing[index] = [
        current.lng,
        current.lat
      ];

      // Keep polygon closed
      if (index === 0) {
        newRing[newRing.length - 1] = [
          current.lng,
          current.lat
        ];
      }

    }

    if (drag.type === "polygon") {

      const deltaLng =
        current.lng - drag.startCoordinate[0];

      const deltaLat =
        current.lat - drag.startCoordinate[1];

      for (let i = 0; i < newRing.length; i++) {
        newRing[i] = [
          drag.originalRing[i][0] + deltaLng,
          drag.originalRing[i][1] + deltaLat
        ];
      }

    }

    // Send updated boundary to App.jsx
    setFarmData(previous => ({
      ...previous,
      features: previous.features.map((feature, index) =>
        index === 0
          ? {
              ...feature,
              geometry: {
                ...feature.geometry,
                coordinates: [newRing]
              }
            }
          : feature
      )
    }));
  }

  // Finish dragging
  function handlePointerUp(event) {
    if (!dragRef.current) return;

    const map = mapRef.current?.getMap();

    if (map) {
      map.dragPan.enable();
    }

    dragRef.current = null;

    setIsDragging(false);

    if (
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        cursor: isDragging ? "grabbing" : "default"
      }}

      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >

      {/* Map and Deck.gl layers */}
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={!isDragging}
        layers={layers}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%"
        }}
      >
        <Map
          ref={mapRef}
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          dragPan={!isDragging}
          style={{
            width: "100%",
            height: "100%"
          }}
        />
      </DeckGL>

      {/* Editing instructions */}
      <div
        style={{
          position: "absolute",
          left: "15px",
          bottom: "15px",
          zIndex: 10,
          background: "white",
          padding: "10px 14px",
          borderRadius: "8px",
          fontSize: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
        }}
      >
        <strong>Farm Editing</strong>
        <p>Drag inside the green area to move it.</p>
        <p>Drag a white corner to reshape it.</p>
      </div>

      {/* Dynamic farm information */}
      {selectedFarm && (
        <div
          style={{
            position: "absolute",
            top: "15px",
            left: "15px",
            zIndex: 10,
            background: "white",
            padding: "18px",
            borderRadius: "10px",
            width: "230px",
            boxShadow: "0 3px 12px rgba(0,0,0,0.2)"
          }}
        >
          <button
            onClick={() => setSelectedFarm(false)}
            style={{
              float: "right",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: "18px"
            }}
          >
            ×
          </button>

          <h3>Farm Information</h3>

          <p>
            <strong>Name:</strong>{" "}
            {farmData.features[0].properties.name}
          </p>

          <p>
            <strong>Area:</strong>{" "}
            {acreage.toFixed(2)} Acres
          </p>

          <p>
            <strong>Latitude:</strong>{" "}
            {centerLatitude.toFixed(6)}
          </p>

          <p>
            <strong>Longitude:</strong>{" "}
            {centerLongitude.toFixed(6)}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {farmData.features[0].properties.status}
          </p>
        </div>
      )}

    </div>
  );
}

export default FarmMap;
