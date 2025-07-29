import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css';

// Fix missing marker icon issue
import L from "leaflet";
import { runQuery } from '../Services/neo4jService';
import { useEffect, useState } from 'react';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function ReactLeaf() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const result = await runQuery("MATCH p=()-[r]->() RETURN p");

      const nodeMap = {};
      const edgeList = [];

      result.forEach(({ p }) => {
        const start = p.start;
        const end = p.end;

        const startId = start.identity.low;
        const endId = end.identity.low;

        // Start node
        if (!nodeMap[startId]) {
          nodeMap[startId] = {
            id: startId,
            label: start.labels[0],
            name: start.properties.ED || start.properties.SF || `Node ${startId}`,
            lat: start.properties.latitude,
            lng: start.properties.longitude,
          };
        }

        // End node
        if (!nodeMap[endId]) {
          nodeMap[endId] = {
            id: endId,
            label: end.labels[0],
            name: end.properties.SF || end.properties.ED || `Node ${endId}`,
            lat: end.properties.latitude,
            lng: end.properties.longitude,
          };
        }

        // Edge
        edgeList.push({
          source: startId,
          target: endId,
          type: p.segments[0].relationship.type,
        });
      });

      // Only include nodes that have coordinates
      const nodeList = Object.values(nodeMap).filter(
        (n) => n.lat != null && n.lng != null
      );

      setNodes(nodeList);
      setEdges(edgeList);
      console.log("edgelist:",edgeList);
      console.log("nodeList:",nodeList);
    };

    fetchData();
  }, []);

  if (nodes.length === 0) return <p>Loading map...</p>;

  const nodeMap = nodes.reduce((acc, node) => {
    acc[node.id] = [node.lat, node.lng];
    return acc;
  }, {});

  return (
    <MapContainer center={[nodes[0].lat, nodes[0].lng]} zoom={10} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Render markers */}
      {nodes.map((node) => (
        <Marker key={node.id} position={[node.lat, node.lng]}>
          <Popup>
            <b>{node.name}</b><br />
            {node.label}
          </Popup>
        </Marker>
      ))}

      {/* Render edges as polylines */}
      {edges.map((edge, index) => {
        const from = nodeMap[edge.source];
        const to = nodeMap[edge.target];

        if (!from || !to) return null;

        return (
          <Polyline key={index} positions={[from, to]} color="blue" />
        );
      })}
    </MapContainer>
  );
}

export default ReactLeaf;