import React from "react";
import {
  Box,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
} from "@mui/material";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

function processGraphResults(data) {
  const rowMap = new Map();
  console.log("data", data);
  data.forEach(({ n: node, r: edge, m: endNode }) => {
    if (!edge || !endNode) return; // skip invalid entries
    const nodeId = node.elementId;

    // Build the edge entry
    const edgeData = {
      type: edge.type,
      startNode: node.properties.name,
      endNode: endNode.properties.name,
      endNodeLabel: endNode.labels[0],
      endNodeLat: endNode.properties.latitude || null,
      endNodeLng: endNode.properties.longitude || null,
    };

    if (!rowMap.has(nodeId)) {
      // Create a new row if this node hasn't been processed yet
      rowMap.set(nodeId, {
        name: node.properties.name || `Node ${node.elementId}`,
        label: node.labels[0],
        elementId: node.elementId,
        subject: node.properties.subject || null,
        subject2: node.properties.subject2 || null,
        type: node.properties.type || null,
        type2: node.properties.type2 || null,
        lat: node.properties.latitude || null,
        lng: node.properties.longitude || null,
        edges: [edgeData],
      });
    } else {
      // Append edge to existing node row
      rowMap.get(nodeId).edges.push(edgeData);
    }
  });

  // Convert the map values to an array
  return Array.from(rowMap.values());
}

function Row({ row, onSelectNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <React.Fragment>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell
          component="th"
          scope="row"
          onClick={() => onSelectNode(row)}
          sx={{
            cursor: "pointer",
            textDecoration: "underline",
            "&:hover": { color: "blue" },
          }}
        >
          {row.name}
        </TableCell>
        <TableCell component="th" scope="row">
          {row.label}
        </TableCell>
        <TableCell align="left">{row.subject}</TableCell>
        <TableCell align="left">{row.subject2}</TableCell>
        <TableCell align="left">{row.type}</TableCell>
        <TableCell align="left">{row.type2}</TableCell>
        <TableCell align="left">{row.lat}</TableCell>
        <TableCell align="left">{row.lng}</TableCell>
        <TableCell align="left">{row.edges.length}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={10}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Edges
              </Typography>
              <Table
                size="small"
                aria-label="purchases"
                sx={{ tableLayout: "fixed" }}
              >
                <colgroup>
                  <col style={{ width: "100px" }} />
                  <col style={{ width: "150px" }} />
                  <col style={{ width: "150px" }} />
                  <col style={{ width: "80px" }} />
                  <col style={{ width: "80px" }} />
                </colgroup>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>End Node</TableCell>
                    <TableCell>End Node Label</TableCell>
                    <TableCell align="right">Latitude</TableCell>
                    <TableCell align="right">Longitude</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.edges.map((edge, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{edge.type}</TableCell>
                      <TableCell
                        onClick={() => onSelectNode(edge)}
                        sx={{
                          cursor: "pointer",
                          textDecoration: "underline",
                          "&:hover": { color: "blue" },
                        }}
                      >
                        {edge.endNode}
                      </TableCell>
                      <TableCell>{edge.endNodeLabel}</TableCell>
                      <TableCell align="right">{edge.endNodeLat}</TableCell>
                      <TableCell align="right">{edge.endNodeLng}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

export default function CollapsibleTable({ resultsData, onSelectNode }) {
  const rows = processGraphResults(resultsData);
  return (
    <TableContainer component={Paper}>
      <Table aria-label="collapsible table" sx={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "20px" }} />
          <col style={{ width: "180px" }} />
          <col style={{ width: "25px" }} />
          <col style={{ width: "175px" }} />
          <col style={{ width: "155px" }} />
          <col style={{ width: "80px" }} />
          <col style={{ width: "100px" }} />
          <col style={{ width: "70px" }} />
          <col style={{ width: "70px" }} />
          <col style={{ width: "30px" }} />
        </colgroup>
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Subject</TableCell>
            <TableCell>Subject2</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Type2</TableCell>
            <TableCell align="right">Latitude</TableCell>
            <TableCell align="right">Longitude</TableCell>
            <TableCell align="right">Number of edges</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, idx) => (
            <Row key={idx} row={row} onSelectNode={onSelectNode} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
