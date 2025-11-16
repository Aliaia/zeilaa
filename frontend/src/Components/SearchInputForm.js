import { useState, useEffect } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Autocomplete,
} from "@mui/material";
import { runQuery } from "../Services/neo4jService";
import { enrichWithGeometry } from "../Services/geometryUtils";

export default function SearchInputForm({
  setResultsData,
  selectedNode,
  setSelectedNode,
  setSelectedNodeFromMap,
}) {
  const [searchOption, setSearchOption] = useState("place");
  const [place, setPlace] = useState("");
  const [placeType, setPlaceType] = useState("");
  const [relationType, setRelationType] = useState("");
  const [resetFlag, setResetFlag] = useState(0);

  // Auto Complete section
  const [autoCompletePlaceOptions, setAutoCompletePlaceOptions] = useState([]);
  const [autoCompleteRelationsOptions, setAutoCompleteRelationsOptions] =
    useState([]);

  // This state triggers the query effect
  const [searchData, setSearchData] = useState({});

  // Handling the search choice so that it can pass the correct data
  const handleSearch = () => {
    if (searchOption === "place") {
      setSearchData({ type: "place", place });
    } else if (searchOption === "placeType") {
      setSearchData({
        type: "placeType",
        place,
        placeType,
        relationType,
      });
    } else if (searchOption === "FindAllSubjectInPlace")
      setSearchData({
        type: "FindAllSubjectInPlace",
        place,
        placeType,
      });
  };

  const handleReset = () => {
    setSelectedNodeFromMap(null); // The detail panel
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
      console.log("fetchnig data...");
      console.log("searchData?.type", searchData?.type);
      if (resetFlag) {
        console.log("reset - showing sample data");
        // Instead of ALL data, just show a small sample
        result = await runQuery(`
          MATCH (n) 
          WHERE n:Place OR n:Unit
          OPTIONAL MATCH (n)-[r]->(m) 
          RETURN n, r, m
          LIMIT 100
        `);
        setResetFlag(0); // reset flag so it doesn't trigger again
      } else if (searchData?.type) {
        const { type, place, placeType, relationType } = searchData;

        switch (type) {
          case "place":
            console.log("place");
            result = await runQuery(
              `
              MATCH (n)-[r]-(m)
              WHERE n.place_name = $place OR n.unit_name = $place
              RETURN n, r, m
              `,
              { place }
            );
            break;

          case "placeType":
            console.log("placeType");
            result = await runQuery(
              `
              MATCH (n)
              WHERE toLower(COALESCE(n.place_name, n.unit_name, '')) CONTAINS toLower($place)
                OR toLower(n.subject) CONTAINS toLower($place)
              MATCH (n)-[r:${relationType}]->(m)
              WHERE toLower(COALESCE(m.place_type, m.unit_type, '')) CONTAINS toLower($placeType)
              RETURN n, r, m
              `,
              { place, placeType }
            );
            break;

          case "FindAllSubjectInPlace":
            console.log("FindAllSubjectInPlace");
            result = await runQuery(
              `
              MATCH (n)-[r]-(m)
              WHERE toLower(COALESCE(n.place_name, n.unit_name, '')) CONTAINS toLower($place)
                AND (
                  toLower(COALESCE(m.place_name, m.unit_name, '')) CONTAINS toLower($placeType)
                  OR toLower(COALESCE(m.place_type, m.unit_type, '')) CONTAINS toLower($placeType)
                  OR toLower(m.type2) CONTAINS toLower($placeType)
                  OR toLower(m.subject) CONTAINS toLower($placeType)
                  OR toLower(m.subject2) CONTAINS toLower($placeType)
                )
              RETURN n, r, m
              `,
              { place, placeType }
            );
            break;

          default:
            console.log("Unknown search type");
            break;
        }
      } else {
        console.log("default - loading initial data");
        // Don't load all data on initial load - just return empty array
        result = [];
      }
      
      // Enrich results with geometry coordinates for map display
      if (result && result.length > 0) {
        result = await enrichWithGeometry(result, runQuery);
      }
      
      setResultsData(result);

      // Autocomplete for suggested text
      const autoCompletePlace = await runQuery(
        `
        MATCH (n)
        WHERE n:Place OR n:Unit
        RETURN DISTINCT COALESCE(n.place_name, n.unit_name) AS name
        ORDER BY name
        LIMIT 1000
        `
      );
      setAutoCompletePlaceOptions(autoCompletePlace.map((place) => place.name).filter(n => n));

      const autoCompleteRelations = await runQuery(
        `
        MATCH ()-[r]->()
        RETURN DISTINCT type(r) AS relationshipType
        ORDER BY relationshipType
        LIMIT 50
        `
      );
      setAutoCompleteRelationsOptions(
        autoCompleteRelations.map((node) => node.relationshipType)
      );
    };

    fetchData();
  }, [searchData, resetFlag]);

  useEffect(() => {
    if (!selectedNode) return;

    const fetchNodeData = async () => {
      console.log("selectedNode");
      const nodeName = selectedNode.endNode ?? selectedNode.name;
      const result = await runQuery(
        `
      MATCH (n)-[r]-(m)
      WHERE n.place_name = $nodeName OR n.unit_name = $nodeName
      RETURN n, r, m
      `,
        { nodeName }
      );
      setResultsData(result);
    };

    fetchNodeData();
  }, [selectedNode]); // runs only when selectedNode changes

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
          flexWrap: "wrap",
          alignItems: "center",
          "& .MuiTextField-root": {
            m: 1,
            width: { xs: "100%", sm: "auto" },
          },
          "& .MuiFormControl-root": {
            m: 1,
            minWidth: { xs: "100%", sm: 200 },
          },
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

        <FormControl sx={{ minWidth: { xs: "100%", sm: 200 }, m: 1 }}>
          <InputLabel>Search Options</InputLabel>
          <Select
            value={searchOption}
            label="Search Options"
            onChange={(e) => {
              console.log(e.target.value);
              setSearchOption(e.target.value);
            }}
          >
            <MenuItem value="place">Where is</MenuItem>
            <MenuItem value="FindAllSubjectInPlace">
              Find all type in place
            </MenuItem>
            <MenuItem value="placeType">Show place + type + relation</MenuItem>
          </Select>
        </FormControl>

        <Autocomplete
          freeSolo
          inputValue={place || ""}
          options={autoCompletePlaceOptions}
          onInputChange={(e, val) => setPlace(val)}
          onChange={(e, val) => setPlace(val)}
          renderInput={(params) => (
            <TextField {...params} label="Place" variant="outlined" required />
          )}
        />

        {searchOption === "placeType" ? (
          <>
            <TextField
              label="Place Type (e.g. university, architectural, hospital)"
              variant="outlined"
              value={placeType}
              onChange={(e) => setPlaceType(e.target.value)}
              required
            />
            <Autocomplete
              freeSolo
              inputValue={relationType || ""}
              options={autoCompleteRelationsOptions}
              onInputChange={(e, val) => setRelationType(val)}
              onChange={(e, val) => setRelationType(val)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Relation"
                  variant="outlined"
                  required
                />
              )}
            />
          </>
        ) : searchOption === "FindAllSubjectInPlace" ? (
          <>
            <TextField
              label="Place Type (e.g. university, architectural, hospital)"
              variant="outlined"
              value={placeType}
              onChange={(e) => setPlaceType(e.target.value)}
              required
            />
          </>
        ) : null}

        <Button
          variant="outlined"
          type="submit"
          disabled={
            searchOption === "place"
              ? !place
              : searchOption === "placeType"
              ? !place || !placeType || !relationType
              : searchOption === "FindAllSubjectInPlace"
              ? !place || !placeType
              : true
          }
          sx={{ m: 1 }}
        >
          Search
        </Button>
      </Box>
    </Box>
  );
}
