import React, { useEffect, useState } from 'react';
import { runQuery } from '../Services/neo4jService';

function Neo4j() {
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await runQuery("MATCH (n) RETURN n LIMIT 10");
      setNodes(data);
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Neo4j AuraDB Nodes</h1>
      <ul>
        {nodes.map((node, index) => (
          <li key={index}>{JSON.stringify(node)}</li>
        ))}
      </ul>
    </div>
  );
}

export default Neo4j;