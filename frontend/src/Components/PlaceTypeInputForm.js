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
        console.log("reset");
        result = await runQuery(
          `MATCH (n) OPTIONAL MATCH (n)-[r]->(m) RETURN n, r, m`
        );
        setResetFlag(0); // reset flag so it doesn't trigger again
      } else {
        if (selectedNode) {
          const nodeName = selectedNode.endNode ?? selectedNode.name; // Depending if the user selects a node or an edge, then name is extracted
          result = await runQuery(
            `
            MATCH (n)-[r]-(m)
            WHERE n.name = "${nodeName}"
            RETURN n, r, m
            `
          );
        } else if (searchData?.type === "place") {
          console.log("place");
          result = await runQuery(
            `
            MATCH (n)-[r]-(m)
            WHERE n.name = $place
            RETURN n, r, m
            `,
            { place: searchData.place }
          );
        } else if (searchData?.type === "placeType") {
          const relationType = searchData.relationType;
          console.log("placeType");
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
        } else if (searchData?.type === "FindAllSubjectInPlace") {
          console.log("FindAllSubjectInPlace");
          result = await runQuery(
            `
            MATCH (n)-[r]-(m)
            WHERE toLower(n.name) CONTAINS toLower($place)
              AND toLower(m.name) CONTAINS toLower($placeType)
              RETURN n, r, m
            `,
            { place: searchData.place, placeType: searchData.placeType }
          );
        } else {
          console.log("default");
          // returns all nodes and edges if no search value is provided, usually loads on first opening of the page
          result = await runQuery(
            `MATCH (n) OPTIONAL MATCH (n)-[r]->(m) RETURN n, r, m`
          );
        }
      }
      setResultsData(result);

      const autoCompletePlace = await runQuery(
        `
        MATCH (n)
        RETURN DISTINCT n.name AS name
        ORDER BY name
        `
      );

      setAutoCompletePlaceOptions(autoCompletePlace.map((place) => place.name));

      const autoCompleteRelations = await runQuery(
        `
        MATCH ()-[r]->()
        RETURN DISTINCT type(r) AS relationshipType
        ORDER BY relationshipType
        `
      );

      setAutoCompleteRelationsOptions(
        autoCompleteRelations.map((node) => node.relationshipType)
      );
      console.log(autoCompleteRelations);
    };

    fetchData();
    console.log("here", autoCompleteRelationsOptions);
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
