import { DeckGL } from "@deck.gl/react";
import { LineLayer, ScatterplotLayer } from "deck.gl";
import { Map } from "react-map-gl/maplibre";

export default function DeckGLPage({ nodes, edges, loading }) {
  const nodeMap = Object.fromEntries((nodes || []).map((n) => [n.id, n]));

  // Scatterplot for markers
  const scatterLayer = new ScatterplotLayer({
    id: "scatter",
    data: nodes,
    getPosition: (d) => [d.lng, d.lat],
    getRadius: 60,
    getFillColor: [255, 0, 255],
  });

  // Polylines for edges
  const lineLayer = new LineLayer({
    id: "lines",
    data: edges
      .map((edge) => {
        const from = nodeMap[edge.source];
        const to = nodeMap[edge.target];
        if (!from || !to) return null;
        return {
          sourcePosition: [from.lng, from.lat],
          targetPosition: [to.lng, to.lat],
        };
      })
      .filter(Boolean),
    getSourcePosition: (d) => d.sourcePosition,
    getTargetPosition: (d) => d.targetPosition,
    getColor: [0, 0, 255],
    getWidth: 2,
  });

  if (loading) return <p>loading...</p>;
  if (!nodes || nodes.length === 0 || nodes === null)
    return <p>No nodes found to show on the map</p>;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "100px",
      }}
    >
      <div style={{ width: "100vw", height: "400px", position: "relative" }}>
        <DeckGL
          initialViewState={{
            longitude: nodes[0].lng,
            latitude: nodes[0].lat,
            zoom: 8,
          }}
          controller={true}
          layers={[scatterLayer, lineLayer]}
          style={{ width: "100%", height: "100%", position: "absolute" }}
        >
          <Map
            mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
            style={{ width: "100%", height: "100%" }}
          />
        </DeckGL>
      </div>
    </div>
  );
}
