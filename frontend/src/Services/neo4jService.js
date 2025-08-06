import neo4j from "neo4j-driver";
import config from "../Secrets/secrets.json";
// Credentials of Neo4J
const uri = config.uri;
const user = config.user;
const password = config.password;

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

export async function runQuery(query, params = {}) {
  const session = driver.session();

  try {
    const result = await session.run(query, params);
    return result.records.map((record) => record.toObject());
  } catch (error) {
    console.error("Neo4j query error:", error);
    return [];
  } finally {
    await session.close();
  }
}
