import * as React from 'react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

function processGraphResults(data) {
  const rowMap = new Map();

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

function Row({ row }) {
  const [open, setOpen] = React.useState(false);

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">{row.name}</TableCell>
        <TableCell component="th" scope="row">{row.label}</TableCell>
        <TableCell align="right">{row.lat}</TableCell>
        <TableCell align="right">{row.lng}</TableCell>
        <TableCell align="right">{row.edges.length}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Edges
              </Typography>
              <Table size="small" aria-label="purchases">
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
                    <TableCell>{edge.endNode}</TableCell>
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

export default function CollapsibleTable({ data }) {
  console.log("rows", data)
  const rows = processGraphResults(data);
  return (
    <TableContainer component={Paper}>
      <Table aria-label="collapsible table">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell align="right">Latitude</TableCell>
            <TableCell align="right">Longitude</TableCell>
            <TableCell align="right">Number of edges</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, idx) => (
            <Row key={idx} row={row} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}