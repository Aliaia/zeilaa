import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";

// Fix missing marker icon issue
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function ReactLeaf({
  nodes,
  edges,
  nodeMap,
  loading,
  setSelectedNodeFromMap,
}) {
  if (loading)
    return (
      <p>
        loading...
        <p>
          If it takes too long, double check the Neo4J credentials in the
          secrets.json file.
        </p>
      </p>
    );
  if (!nodes || nodes.length === 0 || nodes === null)
    return <p>No nodes found to show on the map</p>;

  return (
    <MapContainer
      center={[nodes[0].lat, nodes[0].lng]}
      zoom={9}
      style={{ height: "50vh", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* Render markers */}
      {nodes.map((node) => (
        <Marker
          key={node.id}
          position={[node.lat, node.lng]}
          eventHandlers={{ click: () => setSelectedNodeFromMap(node) }}
        >
          <Popup>
            <b>{node.name}</b>
            <br />
            {node.label}
          </Popup>
        </Marker>
      ))}

      {/* Render edges as polylines */}
      {edges.map((edge, index) => {
        const from = nodeMap[edge.source];
        const to = nodeMap[edge.target];

        if (!from || !to) return null;

        return <Polyline key={index} positions={[from, to]} color="blue" />;
      })}
    </MapContainer>
  );
}
