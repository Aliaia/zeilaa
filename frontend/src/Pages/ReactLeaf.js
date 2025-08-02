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

export default function ReactLeaf({ placeQuery }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    if (placeQuery) {
      // Run Neo4j query when placeQuery changes
      console.log("query here", placeQuery)
    }
    const fetchData = async () => {
      // const result = await runQuery("MATCH p=()-[r]->() RETURN p");
      const result = await runQuery(
        `
        MATCH (place)
        WHERE toLower(place.subject) CONTAINS toLower($place)
          AND place.latitude IS NOT NULL
          AND place.longitude IS NOT NULL
        RETURN 
          id(place) AS id,
          place.place AS name,
          place.latitude AS lat,
          place.longitude AS lng,
          labels(place) AS labels
        `,
        { place: placeQuery }
      );
      console.log("result:", result)

      const nodeMap = {};
      const edgeList = [];

      // Handle both node results and path results
      result.forEach((row) => {
        // Case 1: It's a path
        if (row.p) {
          const path = row.p;
          path.segments.forEach((segment) => {
            const start = segment.start;
            const end = segment.end;
            const rel = segment.relationship;

            const startId = start.identity.low;
            const endId = end.identity.low;

            // Add start node
            if (!nodeMap[startId]) {
              nodeMap[startId] = {
                id: startId,
                label: start.labels[0],
                name: start.properties.ED || start.properties.SF || start.properties.name || `Node ${startId}`,
                lat: start.properties.latitude,
                lng: start.properties.longitude,
              };
            }

            // Add end node
            if (!nodeMap[endId]) {
              nodeMap[endId] = {
                id: endId,
                label: end.labels[0],
                name: end.properties.SF || end.properties.ED || end.properties.name || `Node ${endId}`,
                lat: end.properties.latitude,
                lng: end.properties.longitude,
              };
            }

            // Add edge
            edgeList.push({
              source: startId,
              target: endId,
              type: rel.type,
            });
          });
        }

        // Case 2: It's a single node (not a path)
        else if (row.id !== undefined && row.lat != null && row.lng != null) {
          const id = row.id;
          if (!nodeMap[id]) {
            nodeMap[id] = {
              id,
              name: row.name,
              label: row.labels?.[0] || 'Place',
              lat: row.lat,
              lng: row.lng,
            };
          }
    }});

    const nodeList = Object.values(nodeMap).filter((n) => n.lat != null && n.lng != null);

      setNodes(nodeList);
      setEdges(edgeList);
      console.log("edgelist:",edgeList);
      console.log("nodeList:",nodeList);
    };

    fetchData();
  }, [placeQuery]);

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