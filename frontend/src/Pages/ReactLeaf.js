import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fix missing marker icon issue
import L from "leaflet";
import { runQuery } from "../Services/neo4jService";
import { useEffect, useState } from "react";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function ReactLeaf({ searchData, OnDataChange }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      let result = await runQuery(`MATCH (n)
        OPTIONAL MATCH (n)-[r]->(m)
        RETURN n, r, m`);

      if (searchData.type == "place") {
        result = await runQuery(
          `
          MATCH (n)
          WHERE toLower(n.subject) CONTAINS toLower($place)
            AND n.latitude IS NOT NULL
            AND n.longitude IS NOT NULL
          WITH collect(n) AS matchedNodes
          UNWIND matchedNodes AS n
          OPTIONAL MATCH (n)-[r]-(m)
          RETURN n, r, m
          `,
          { place: searchData.place }
        );
      }

      if (searchData.type == "placeType") {
        const relationType = searchData.relationType;
        result = await runQuery(
          `
          MATCH (n)
          WHERE (
            toLower(n.name) CONTAINS toLower($place) OR
            toLower(n.subject) CONTAINS toLower($place)
          )
          MATCH (n)-[r:${relationType}]->(m)
          WHERE toLower(m.type) CONTAINS toLower($placeType)
          RETURN n, r, m
          `,
          { place: searchData.place, placeType: searchData.placeType }
        );
      }

      const nodeMap = {};
      const edgeList = [];

      // Handle both node results and path results
      result.forEach((row) => {
        const start = row.n;
        const rel = row.r;
        const end = row.m;

        const startId = start.identity.low;

        // Add start node
        if (!nodeMap[startId]) {
          nodeMap[startId] = {
            id: startId,
            label: start.labels[0],
            name:
              start.properties.ED ||
              start.properties.SF ||
              start.properties.name ||
              `Node ${startId}`,
            lat: start.properties.latitude,
            lng: start.properties.longitude,
          };
        }

        // If there is a relationship and an end node
        if (rel && end) {
          const endId = end.identity.low;

          // Add end node
          if (!nodeMap[endId]) {
            nodeMap[endId] = {
              id: endId,
              label: end.labels[0],
              name:
                end.properties.SF ||
                end.properties.ED ||
                end.properties.name ||
                `Node ${endId}`,
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
        }

        // Case 2: It's a single node (not a path)
        else if (row.id !== undefined && row.lat != null && row.lng != null) {
          const id = row.id;
          if (!nodeMap[id]) {
            nodeMap[id] = {
              id,
              name: row.name,
              label: row.labels?.[0] || "Place",
              lat: row.lat,
              lng: row.lng,
            };
          }
        }
      });

      const nodeList = Object.values(nodeMap).filter(
        (n) => n.lat != null && n.lng != null
      );

      setNodes(nodeList);
      setEdges(edgeList);
      OnDataChange(result);
    };

    fetchData();
  }, [searchData]);

  if (nodes.length === 0) return <p>Loading map...</p>;

  const nodeMap = nodes.reduce((acc, node) => {
    acc[node.id] = [node.lat, node.lng];
    return acc;
  }, {});

  return (
    <MapContainer
      center={[nodes[0].lat, nodes[0].lng]}
      zoom={9}
      style={{ height: "50vh", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* Render markers */}
      {nodes.map((node) => (
        <Marker key={node.id} position={[node.lat, node.lng]}>
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
