/**
 * Parse WKT POINT string and extract longitude and latitude
 * @param {string} wkt - WKT format string like "POINT (-3.17 51.46)"
 * @returns {{lng: number, lat: number} | null}
 */
export function parseWKTPoint(wkt) {
  if (!wkt || typeof wkt !== 'string') return null;
  
  // Match POINT (lon lat) format
  const match = wkt.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
  if (match) {
    return {
      lng: parseFloat(match[1]),
      lat: parseFloat(match[2])
    };
  }
  
  return null;
}

/**
 * Enrich node data with geometry coordinates from Neo4j results
 * @param {Array} results - Neo4j query results
 * @returns {Promise<Array>} - Enriched results with lat/lng
 */
export async function enrichWithGeometry(results, runQuery) {
  if (!results || results.length === 0) return results;
  
  // Get all node IDs that need geometry
  const nodeIds = new Set();
  results.forEach(row => {
    if (row.n?.identity) nodeIds.add(row.n.identity.low);
    if (row.m?.identity) nodeIds.add(row.m.identity.low);
  });
  
  if (nodeIds.size === 0) return results;
  
  // Query for geometries of these nodes
  const geometryQuery = `
    MATCH (n)
    WHERE id(n) IN $nodeIds
    OPTIONAL MATCH (n)-[:HAS_MAIN_GEOMETRY]->(g:Geometry)
    RETURN id(n) as nodeId, g.wkt as wkt
  `;
  
  const geometries = await runQuery(geometryQuery, {
    nodeIds: Array.from(nodeIds)
  });
  
  // Build geometry map
  const geomMap = {};
  geometries.forEach(g => {
    if (g.wkt) {
      const coords = parseWKTPoint(g.wkt);
      if (coords) {
        geomMap[g.nodeId] = coords;
      }
    }
  });
  
  // Enrich original results
  return results.map(row => {
    const enrichedRow = { ...row };
    
    if (row.n?.identity) {
      const nId = row.n.identity.low;
      if (geomMap[nId]) {
        enrichedRow.n = {
          ...row.n,
          properties: {
            ...row.n.properties,
            latitude: geomMap[nId].lat,
            longitude: geomMap[nId].lng
          }
        };
      }
    }
    
    if (row.m?.identity) {
      const mId = row.m.identity.low;
      if (geomMap[mId]) {
        enrichedRow.m = {
          ...row.m,
          properties: {
            ...row.m.properties,
            latitude: geomMap[mId].lat,
            longitude: geomMap[mId].lng
          }
        };
      }
    }
    
    return enrichedRow;
  });
}
