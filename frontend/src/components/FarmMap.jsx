
import { useMemo } from "react";
import Map from "react-map-gl/maplibre";

import { DeckGL } from "@deck.gl/react";
import { GeoJsonLayer } from "@deck.gl/layers";

import "maplibre-gl/dist/maplibre-gl.css";

import { farmGeoJSON } from "../data/mockFarmData";

const INITIAL_VIEW_STATE = {
  longitude: 78.01,
  latitude: 17.01,
  zoom: 13,
  pitch: 35,
  bearing: 0
};

function FarmMap() {
  const layers = useMemo(
    () => [
      new GeoJsonLayer({
        id: "farm-boundary",
        data: farmGeoJSON,

        filled: true,
        stroked: true,

        getFillColor: [46, 125, 50, 45],
        getLineColor: [46, 160, 67, 255],

        getLineWidth: 3,
        lineWidthMinPixels: 2,

        pickable: true
      })
    ],
    []
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden"
      }}
    >
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
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
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          style={{
            width: "100%",
            height: "100%"
          }}
        />
      </DeckGL>
    </div>
  );
}

export default FarmMap;
