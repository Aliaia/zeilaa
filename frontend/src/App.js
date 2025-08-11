import "./App.css";
import { useState } from "react";
import CollapsibleTable from "./Components/CollapsibleTable";
import PlaceTypeInputForm from "./Components/PlaceTypeInputForm";
import MapTabs from "./Pages/MapTabs";

export default function App() {
  const [resultsData, setResultsData] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  return (
    <div className="App">
      {/* receives the result data from Neo4J */}
      <PlaceTypeInputForm
        setResultsData={setResultsData}
        selectedNode={selectedNode}
        setSelectedNode={setSelectedNode}
      />

      {/* Two maps in tab options */}
      <MapTabs resultsData={resultsData} />

      {/* The collapsible table of the results */}
      <CollapsibleTable
        resultsData={resultsData}
        onSelectNode={setSelectedNode}
      />
    </div>
  );
}
