import { useEffect, useState } from "react";
import { Tabs, Tab, Box } from "@mui/material";
import ReactLeaf from "./ReactLeaf";
import DeckGLPage from "./DeckGLPage";

function TabPanel({ children, value, index }) {
  return (
    <div
      hidden={value !== index}
      role="tabpanel"
      aria-labelledby={`tab-${index}`}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export default function MapTabs({ resultsData, setSelectedNodeFromMap }) {
  const [tabIndex, setTabIndex] = useState(0);
  const handleChange = (_, newValue) => {
    setTabIndex(newValue);
  };

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [nodeMap, setNodeMap] = useState({});

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function processData() {
      if (!resultsData || resultsData.length === 0) {
        setNodes(null);
        return;
      }

      const nodeMapTemp = {};
      const edgeList = [];

      resultsData.forEach((row) => {
        const start = row.n;
        const rel = row.r;
        const end = row.m;

        if (!start || !start.identity) return;

        const startId = start.identity.low;

        if (!nodeMapTemp[startId]) {
          nodeMapTemp[startId] = {
            id: startId,
            label: start.labels?.[0],
            name:
              start.properties?.place_name ||
              start.properties?.unit_name ||
              start.properties?.name ||
              `Node ${startId}`,
            lat: start.properties?.latitude,
            lng: start.properties?.longitude,
            subject: start.properties?.subject || null,
            subject2: start.properties?.subject2 || null,
            type: start.properties?.place_type || start.properties?.unit_type || start.properties?.type || null,
            type2: start.properties?.type2 || null,
          };
        }

        if (rel && end && end.identity) {
          const endId = end.identity.low;

          if (!nodeMapTemp[endId]) {
            nodeMapTemp[endId] = {
              id: endId,
              label: end.labels?.[0],
              name:
                end.properties?.place_name ||
                end.properties?.unit_name ||
                end.properties?.name ||
                `Node ${endId}`,
              lat: end.properties?.latitude,
              lng: end.properties?.longitude,
              subject: end.properties?.subject || null,
              subject2: end.properties?.subject2 || null,
              type: end.properties?.place_type || end.properties?.unit_type || end.properties?.type || null,
              type2: end.properties?.type2 || null,
            };
          }

          edgeList.push({
            source: startId,
            target: endId,
            type: rel.type,
          });
        }
      });
      console.log("nodeList length total", Object.keys(nodeMapTemp).length);
      const nodeList = Object.values(nodeMapTemp).filter(
        (n) => n.lat != null && n.lng != null
      );

      const nodePosMap = nodeList.reduce((acc, node) => {
        acc[node.id] = [node.lat, node.lng];
        return acc;
      }, {});

      setNodes(nodeList);
      setEdges(edgeList);
      console.log("nodeList length only lng,lat: ", nodeList.length);
      console.log("edgeList length", edgeList.length);
      setNodeMap(nodePosMap);
      setLoading(false);
    }

    processData();
  }, [resultsData]);

  return (
    <Box sx={{ width: "100%" }}>
      <Tabs value={tabIndex} onChange={handleChange} centered>
        <Tab label="ReactLeaf" id="tab-0" aria-controls="tabpanel-0" />
        <Tab label="DeckGL" id="tab-1" aria-controls="tabpanel-1" />
      </Tabs>
      <TabPanel value={tabIndex} index={0}>
        <ReactLeaf
          nodes={nodes}
          edges={edges}
          nodeMap={nodeMap}
          loading={loading}
          setSelectedNodeFromMap={setSelectedNodeFromMap}
        />
      </TabPanel>
      <TabPanel value={tabIndex} index={1}>
        <DeckGLPage nodes={nodes} edges={edges} loading={loading} />
      </TabPanel>
    </Box>
  );
}
