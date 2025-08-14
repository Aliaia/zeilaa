import "./App.css";
import { useState } from "react";
import CollapsibleTable from "./Components/CollapsibleTable";
import PlaceTypeInputForm from "./Components/PlaceTypeInputForm";
import MapTabs from "./Pages/MapTabs";
import DetailedPanel from "./Components/DetailedPanel";
import { Box } from "@mui/material";

export default function App() {
  const [resultsData, setResultsData] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedNodeFromMap, setSelectedNodeFromMap] = useState(null);

  return (
    <div className="App">
      {/* receives the result data from Neo4J */}
      <PlaceTypeInputForm
        setResultsData={setResultsData}
        selectedNode={selectedNode}
        setSelectedNode={setSelectedNode}
        setSelectedNodeFromMap={setSelectedNodeFromMap}
      />

      <Box sx={{ display: "flex", flexWrap: "wrap", width: "100%" }}>
        <Box
          sx={{
            width: { xs: "100%", md: "70%" }, // full width on xs/sm, half on md+
          }}
        >
          {/* Two maps in tab options */}
          <MapTabs
            resultsData={resultsData}
            setSelectedNodeFromMap={setSelectedNodeFromMap}
          />
        </Box>
        <Box
          sx={{
            width: { xs: "100%", md: "30%" }, // full width on xs/sm, half on md+
          }}
        >
          {/* Right side Detail Panel */}
          <DetailedPanel
            selectedNodeFromMap={selectedNodeFromMap}
            setSelectedNode={setSelectedNode}
          />
        </Box>
      </Box>

      {/* The collapsible table of the results */}
      <CollapsibleTable
        resultsData={resultsData}
        onSelectNode={setSelectedNode}
      />
    </div>
  );
}
