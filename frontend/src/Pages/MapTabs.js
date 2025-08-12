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

export default function MapTabs({ resultsData }) {
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
              start.properties?.ED ||
              start.properties?.SF ||
              start.properties?.name ||
              `Node ${startId}`,
            lat: start.properties?.latitude,
            lng: start.properties?.longitude,
          };
        }

        if (rel && end && end.identity) {
          const endId = end.identity.low;

          if (!nodeMapTemp[endId]) {
            nodeMapTemp[endId] = {
              id: endId,
              label: end.labels?.[0],
              name:
                end.properties?.SF ||
                end.properties?.ED ||
                end.properties?.name ||
                `Node ${endId}`,
              lat: end.properties?.latitude,
              lng: end.properties?.longitude,
            };
          }

          edgeList.push({
            source: startId,
            target: endId,
            type: rel.type,
          });
        }
      });

      const nodeList = Object.values(nodeMapTemp).filter(
        (n) => n.lat != null && n.lng != null
      );

      const nodePosMap = nodeList.reduce((acc, node) => {
        acc[node.id] = [node.lat, node.lng];
        return acc;
      }, {});

      setNodes(nodeList);
      setEdges(edgeList);
      setNodeMap(nodePosMap);
      setLoading(false);
    }

    processData();
  }, [resultsData]);

  return (
    <Box sx={{ width: "100%" }}>
      <Tabs
        value={tabIndex}
        onChange={handleChange}
        aria-label="simple tabs example"
        centered
      >
        <Tab label="ReactLeaf" id="tab-0" aria-controls="tabpanel-0" />
        <Tab label="DeckGL" id="tab-1" aria-controls="tabpanel-1" />
      </Tabs>
      <TabPanel value={tabIndex} index={0}>
        <ReactLeaf
          nodes={nodes}
          edges={edges}
          nodeMap={nodeMap}
          loading={loading}
        />
      </TabPanel>
      <TabPanel value={tabIndex} index={1}>
        <DeckGLPage nodes={nodes} edges={edges} loading={loading} />
      </TabPanel>
    </Box>
  );
}
