import { useState, useEffect } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
} from "@mui/material";
import { runQuery } from "../Services/neo4jService";

export default function PlaceTypeInputForm({
  setResultsData,
  selectedNode,
  setSelectedNode,
}) {
  const [searchOption, setSearchOption] = useState("place");
  const [place, setPlace] = useState("");
  const [placeType, setPlaceType] = useState("");
  const [relationType, setRelationType] = useState("");
  const [resetFlag, setResetFlag] = useState(0);

  // This state triggers the query effect
  const [searchData, setSearchData] = useState({});

  const handleSearch = () => {
    if (searchOption === "place") {
      setSearchData({ type: "place", place });
    } else {
      setSearchData({
        type: "placeType",
        place,
        placeType,
        relationType,
      });
    }
  };

  const handleReset = () => {
    setPlace("");
    setPlaceType("");
    setRelationType("");
    setSelectedNode(null);
    setSearchData(null);
    setResetFlag((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchData = async () => {
      let result;
      if (resetFlag) {
        result = await runQuery(
          `MATCH (n) OPTIONAL MATCH (n)-[r]->(m) RETURN n, r, m`
        );
        setResetFlag(0); // reset flag so it doesn't trigger again
      } else {
        if (selectedNode) {
          const nodeName = selectedNode.endNode ?? selectedNode.name; // Depending if the user selects a node or an edge, then name is extracted
          console.log(selectedNode);
          result = await runQuery(
            `
            MATCH (n)-[r]-(m)
            WHERE n.name = "${nodeName}"
            RETURN n, r, m
            `
          );
        } else if (searchData?.type === "place") {
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
        } else if (searchData?.type === "placeType") {
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
        } else {
          // returns all nodes and edges if no search value is provided, usually loads on first opening of the page
          result = await runQuery(
            `MATCH (n) OPTIONAL MATCH (n)-[r]->(m) RETURN n, r, m`
          );
        }
      }
      setResultsData(result);
    };

    fetchData();
  }, [searchData, selectedNode, resetFlag]);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        m: 3,
      }}
    >
      <Box
        component="form"
        sx={{
          display: "flex",
          alignItems: "center",
          "& .MuiTextField-root": { m: 1, width: "50ch" },
        }}
        noValidate
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
      >
        <Button variant="outlined" sx={{ m: 1 }} onClick={handleReset}>
          Reset
        </Button>
        <FormControl sx={{ minWidth: 200, m: 1 }}>
          <InputLabel>Search Options</InputLabel>
          <Select
            value={searchOption}
            label="Search Options"
            onChange={(e) => setSearchOption(e.target.value)}
          >
            <MenuItem value="place">Search by Place</MenuItem>
            <MenuItem value="placeType">
              Search by Place + Type + Relation
            </MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Place"
          variant="outlined"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          required
        />

        {searchOption === "placeType" && (
          <>
            <TextField
              label="Place Type (e.g. university, architectural, hospital)"
              variant="outlined"
              value={placeType}
              onChange={(e) => setPlaceType(e.target.value)}
              required
            />
            <TextField
              label="Relation (e.g. N,S,E,W,CONTAINS)"
              variant="outlined"
              value={relationType}
              onChange={(e) => setRelationType(e.target.value)}
              required
            />
          </>
        )}

        <Button variant="outlined" type="submit" disabled={!place}>
          Search
        </Button>
      </Box>
    </Box>
  );
}
