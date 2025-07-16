import neo4j from 'neo4j-driver';

// Replace with your AuraDB connection details
const uri = "URI HERE";
const user = "neo4j"; // usually 'neo4j'
const password = "Pass Here";

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

export async function runQuery(query, params = {}) {
  const session = driver.session();

  try {
    const result = await session.run(query, params);
    return result.records.map(record => record.toObject());
  } catch (error) {
    console.error("Neo4j query error:", error);
    return [];
  } finally {
    await session.close();
  }
}
