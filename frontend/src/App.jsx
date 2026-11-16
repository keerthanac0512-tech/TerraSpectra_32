
import FarmMap from "./components/FarmMap";
import "./App.css";

function App() {
  return (
    <div className="app">
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
        <section className="welcome">
          <div>
            <h2>Farm Monitoring Dashboard</h2>
            <p>
              Monitor agricultural fields and visualize
              geographical crop-health data.
            </p>
          </div>
        </section>

        <section className="stats">
          <div className="stat-card">
            <h3>Total Farm Area</h3>
            <p>1,000 Acres</p>
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
        </section>

        <section className="map-section">
          <div className="section-heading">
            <h2>Geospatial Farm View</h2>
            <span>Simulated farm data</span>
          </div>

          <div className="map-container">
            <FarmMap />
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
