import {
  Box,
  Card,
  CardContent,
  Link,
  List,
  ListItem,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { runQuery } from "../Services/neo4jService";

export default function DetailedPanel({
  selectedNodeFromMap,
  setSelectedNode,
}) {
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedNodeFromMap !== null) {
        let result = await runQuery(
          `
            MATCH (n {name: $nodeName})-[r]-(m)
            WITH type(r) AS relationshipType, collect(m.name) AS name
            RETURN relationshipType, name
        `,
          { nodeName: selectedNodeFromMap.name }
        );
        console.log("result of edges", result);
        setEdges(result);
      }
    };
    fetchData();
  }, [selectedNodeFromMap]);

  // Map relationshipType to label
  const relationshipLabels = {
    N: "North",
    NE: "North East",
    E: "East",
    SE: "South East",
    S: "South",
    SW: "South West",
    W: "West",
    NW: "North West",
    CONTAINS: "Contains",
  };

  return (
    <Box sx={{ width: "100%", marginTop: "65px" }}>
      <Card sx={{ maxWidth: 500 }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: "green", fontWeight: "bold" }}>
            Detail Panel:
          </Typography>
          {selectedNodeFromMap === null ? (
            <Typography>Select a node from the map to show data</Typography>
          ) : (
            <>
              <List dense>
                <ListItem>
                  <Typography variant="body2">
                    <strong>Name:</strong> {selectedNodeFromMap.name}
                  </Typography>
                </ListItem>
                <ListItem>
                  <Typography variant="body2">
                    <strong>Type:</strong> {selectedNodeFromMap.type}
                  </Typography>
                </ListItem>
                <ListItem>
                  <Typography variant="body2">
                    <strong>Location:</strong> {selectedNodeFromMap.lng}
                    {", "}
                    {selectedNodeFromMap.lat}
                  </Typography>
                </ListItem>
                <ListItem>
                  <Typography variant="body2">
                    <strong>Properties:</strong> {selectedNodeFromMap.type2}
                    {selectedNodeFromMap.subject !== null && ", "}
                    {selectedNodeFromMap.subject}
                    {selectedNodeFromMap.subject2 !== null && ", "}
                    {selectedNodeFromMap.subject2}
                  </Typography>
                </ListItem>
              </List>

              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Relationships:
              </Typography>

              {edges.map((edge, index) => (
                <Box sx={{ pl: 2, pt: 2 }}>
                  <Typography variant="body2" key={index}>
                    {relationshipLabels[edge.relationshipType] ||
                      edge.relationshipType}
                    :
                    {edge.name.map((item, i) => (
                      <span key={i}>
                        {" "}
                        <Link
                          component="button"
                          onClick={() => setSelectedNode({ name: item })}
                        >
                          {item}
                        </Link>
                        {i < edge.name.length - 1 ? "," : ""}
                      </span>
                    ))}
                  </Typography>
                </Box>
              ))}
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mt: 2,
                  p: 0.5,
                }}
              >
                Each related place is a clickable link that changes the map and
                table view focus
              </Typography>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
