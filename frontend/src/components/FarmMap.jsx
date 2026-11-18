
import { useMemo, useRef, useState } from "react";
import Map from "react-map-gl/maplibre";

import { DeckGL } from "@deck.gl/react";
import { GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";

import { setWorkerUrl } from "maplibre-gl";
import maplibreWorker from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

import "maplibre-gl/dist/maplibre-gl.css";

import { farmGeoJSON } from "../data/mockFarmData";

setWorkerUrl(maplibreWorker);

const INITIAL_VIEW_STATE = {
  longitude: 78.01,
  latitude: 17.01,
  zoom: 13,
  pitch: 0,
  bearing: 0
};

// Check whether a screen point is inside the farm polygon
function isPointInsidePolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;

  for (
    let i = 0, j = polygon.length - 1;
    i < polygon.length;
    j = i++
  ) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

function FarmMap() {
  const mapRef = useRef(null);
  const dragRef = useRef(null);

  const [farmData, setFarmData] = useState(() =>
    JSON.parse(JSON.stringify(farmGeoJSON))
  );

  const [selectedFarm, setSelectedFarm] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const ring = farmData.features[0].geometry.coordinates[0];

  // Build the editable map layers
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

    // Check whether a corner was selected
    const vertexIndex = projectedVertices.findIndex(([x, y]) => {
      const distance = Math.hypot(
        pixel[0] - x,
        pixel[1] - y
      );

      return distance < 14;
    });

    const clickedCoordinate = map.unproject(pixel);

    if (vertexIndex !== -1) {
      dragRef.current = {
        type: "vertex",
        vertexIndex,
        originalRing: ring.map(position => [...position])
      };
    } else if (
      isPointInsidePolygon(pixel, projectedVertices)
    ) {
      dragRef.current = {
        type: "polygon",
        startCoordinate: [
          clickedCoordinate.lng,
          clickedCoordinate.lat
        ],
        originalRing: ring.map(position => [...position])
      };

      setSelectedFarm(farmData.features[0].properties);
    } else {
      return;
    }

    map.dragPan.disable();
    setIsDragging(true);

    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

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

      newRing[index] = [current.lng, current.lat];

      // Keep the polygon closed
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

    setFarmData(previous => {
      const updated = {
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
      };

      return updated;
    });
  }

  function handlePointerUp(event) {
    if (!dragRef.current) return;

    const map = mapRef.current?.getMap();

    if (map) {
      map.dragPan.enable();
    }

    dragRef.current = null;
    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
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
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          dragPan={!isDragging}
          style={{
            width: "100%",
            height: "100%"
          }}
        />
      </DeckGL>

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
            onClick={() => setSelectedFarm(null)}
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
          <p><strong>Name:</strong> {selectedFarm.name}</p>
          <p><strong>Area:</strong> {selectedFarm.acreage} Acres</p>
          <p><strong>Status:</strong> {selectedFarm.status}</p>
        </div>
      )}
    </div>
  );
}

export default FarmMap;
