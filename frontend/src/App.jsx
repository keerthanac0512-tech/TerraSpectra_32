
import { useState } from "react";

import FarmMap from "./components/FarmMap";
import { farmGeoJSON } from "./data/mockFarmData";

import { area } from "@turf/area";
import { polygon } from "@turf/helpers";

import "./App.css";

function App() {
  // Store the farm boundary in the main dashboard
  const [farmData, setFarmData] = useState(() =>
    JSON.parse(JSON.stringify(farmGeoJSON))
  );

  // Get the current farm boundary
  const ring = farmData.features[0].geometry.coordinates[0];

  // Calculate farm area in acres
  const farmArea = area(polygon([ring])) / 4046.8564224;

  // Calculate approximate center coordinates
  const coordinates = ring.slice(0, -1);

  const centerLatitude =
    coordinates.reduce((sum, point) => sum + point[1], 0) /
    coordinates.length;

  const centerLongitude =
    coordinates.reduce((sum, point) => sum + point[0], 0) /
    coordinates.length;

  // Reset farm to original boundary
  function resetFarm() {
    setFarmData(JSON.parse(JSON.stringify(farmGeoJSON)));
  }

  return (
    <div className="app">

      {/* Header */}
      <header className="header">
        <div>
          <h1>TerraSpectra</h1>
          <p>Hyperspectral Crop Disease Forecasting</p>
        </div>

        <div className="status">
          <span className="status-dot"></span>
          Monitoring System
        </div>
      </header>

      <main className="dashboard">

        {/* Welcome Section */}
        <section className="welcome">
          <div>
            <h2>Farm Monitoring Dashboard</h2>
            <p>
              Monitor agricultural fields and visualize
              geographical crop-health data.
            </p>
          </div>
        </section>

        {/* Dashboard Statistics */}
        <section className="stats">

          <div className="stat-card">
            <h3>Total Farm Area</h3>
            <p>{farmArea.toFixed(2)} Acres</p>
          </div>

          <div className="stat-card">
            <h3>Monitoring Status</h3>
            <p>Active</p>
          </div>

          <div className="stat-card">
            <h3>Spectral Bands</h3>
            <p>220</p>
          </div>

          <div className="stat-card">
            <h3>High-Risk Area</h3>
            <p>Not yet evaluated</p>
          </div>

          <div className="stat-card">
            <h3>Farm Center</h3>
            <p>
              {centerLatitude.toFixed(6)},{" "}
              {centerLongitude.toFixed(6)}
            </p>
          </div>

        </section>

        {/* Farm Map Section */}
        <section className="map-section">

          <div className="section-heading">
            <div>
              <h2>Geospatial Farm View</h2>
              <span>Simulated farm data</span>
            </div>

            <button onClick={resetFarm}>
              Reset Boundary
            </button>
          </div>

          <div className="map-container">
            <FarmMap
              farmData={farmData}
              setFarmData={setFarmData}
            />
          </div>

        </section>

      </main>
    </div>
  );
}

export default App;
