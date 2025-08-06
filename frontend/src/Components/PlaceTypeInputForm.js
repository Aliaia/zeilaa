import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

export default function PlaceTypeInputForm({ onSearchChange }) {
  const [searchOption, setSearchOption] = useState("place");
  const [place, setPlace] = useState("");
  const [placeType, setPlaceType] = useState("");
  const [relationType, setRelationType] = useState("");

  const handleSearch = () => {
    if (searchOption === "place") {
      onSearchChange({ type: "place", place });
    } else {
      onSearchChange({
        type: "placeType",
        place,
        placeType,
        relationType,
      });
    }
  };

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
      >
        {/* Select search mode */}
        <FormControl>
          <InputLabel>Search Options</InputLabel>
          <Select
            value={searchOption}
            label="Search Options"
            onChange={(e) => setSearchOption(e.target.value)}
          >
            <MenuItem value="place">Search by Place</MenuItem>
            <MenuItem value="placetype">
              Search by Place + Type + Relation
            </MenuItem>
          </Select>
        </FormControl>

        {/* Common input: Place */}
        <TextField
          label="Place"
          variant="outlined"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          fullWidth
        />

        {/* Conditional fields for place + place type + relationship */}
        {searchOption === "placetype" && (
          <>
            <TextField
              label="Place Type (e.g. university, architectural, hospital)"
              variant="outlined"
              value={placeType}
              onChange={(e) => setPlaceType(e.target.value)}
              fullWidth
            />
            <TextField
              label="Relation (e.g. N,S,E,W,CONTAINS)"
              variant="outlined"
              value={relationType}
              onChange={(e) => setRelationType(e.target.value)}
              fullWidth
            />
          </>
        )}
        <Button
          variant="outlined"
          sx={{ m: 1, height: "fit-content" }}
          onClick={handleSearch}
          disabled={!place}
        >
          Search
        </Button>
      </Box>
    </Box>
  );
}
