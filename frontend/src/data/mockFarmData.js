
export const farmBoundary = {
  type: "Feature",
  properties: {
    name: "TerraSpectra Demo Farm",
    acreage: 1000,
    status: "Monitoring"
  },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [78.000, 17.000],
        [78.020, 17.000],
        [78.020, 17.020],
        [78.000, 17.020],
        [78.000, 17.000]
      ]
    ]
  }
};

export const farmGeoJSON = {
  type: "FeatureCollection",
  features: [farmBoundary]
};
