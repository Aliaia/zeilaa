"""
Neo4j Importer for QPM Ontology Data
Handles batch import of large-scale spatial data into Neo4j
"""

from neo4j import GraphDatabase
from typing import Dict, List, Any, Optional
from tqdm import tqdm
import time


class Neo4jImporter:
    """Handles batch import of QPM data into Neo4j"""

    def __init__(self, uri: str, user: str, password: str):
        """
        Initialize Neo4j connection.

        Args:
            uri: Neo4j connection URI (e.g., "bolt://localhost:7687")
            user: Neo4j username
            password: Neo4j password
        """
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
        self.batch_size = 1000  # Default batch size for imports

    def close(self):
        """Close Neo4j connection."""
        self.driver.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def clear_database(self, confirm: bool = False):
        """
        Clear all nodes and relationships from the database.
        USE WITH CAUTION!

        Args:
            confirm: Must be True to actually clear the database
        """
        if not confirm:
            print("⚠️  Database clear not confirmed. Skipping.")
            return

        print("🗑️  Clearing database...")
        with self.driver.session() as session:
            # Delete all relationships and nodes
            session.run("MATCH (n) DETACH DELETE n")
            print("✅ Database cleared")

    def create_constraints_and_indexes(self):
        """Create all necessary constraints and indexes for the QPM schema."""
        print("📐 Creating constraints and indexes...")

        with self.driver.session() as session:
            # Constraints
            constraints = [
                # Unit constraints
                "CREATE CONSTRAINT unit_id_unique IF NOT EXISTS FOR (u:Unit) REQUIRE u.spatial_unit_id IS UNIQUE",

                # Place constraints
                "CREATE CONSTRAINT place_id_unique IF NOT EXISTS FOR (p:Place) REQUIRE p.place_id IS UNIQUE",

                # Hierarchy constraints
                "CREATE CONSTRAINT hierarchy_id_unique IF NOT EXISTS FOR (h:Hierarchy) REQUIRE h.hierarchy_id IS UNIQUE",
                "CREATE CONSTRAINT hierarchy_name_unique IF NOT EXISTS FOR (h:Hierarchy) REQUIRE h.hierarchy_name IS UNIQUE",

                # Geometry constraints
                "CREATE CONSTRAINT geometry_id_unique IF NOT EXISTS FOR (g:Geometry) REQUIRE g.geometry_id IS UNIQUE",
            ]

            for constraint in tqdm(constraints, desc="Creating constraints"):
                try:
                    session.run(constraint)
                except Exception as e:
                    print(f"⚠️  Constraint may already exist: {e}")

            # Indexes
            indexes = [
                # Search indexes
                "CREATE INDEX unit_name_index IF NOT EXISTS FOR (u:Unit) ON (u.unit_name)",
                "CREATE INDEX place_name_index IF NOT EXISTS FOR (p:Place) ON (p.place_name)",

                # Spatial query indexes
                "CREATE INDEX unit_h3_index IF NOT EXISTS FOR (u:Unit) ON (u.unit_h3)",
                "CREATE INDEX place_h3_index IF NOT EXISTS FOR (p:Place) ON (p.place_h3)",
                "CREATE INDEX place_s2_index IF NOT EXISTS FOR (p:Place) ON (p.place_s2)",

                # Hierarchy traversal indexes
                "CREATE INDEX unit_level_index IF NOT EXISTS FOR (u:Unit) ON (u.unit_level)",
                "CREATE INDEX place_level_index IF NOT EXISTS FOR (p:Place) ON (p.place_level)",

                # Filtering indexes
                "CREATE INDEX unit_type_index IF NOT EXISTS FOR (u:Unit) ON (u.unit_type)",
                "CREATE INDEX place_type_index IF NOT EXISTS FOR (p:Place) ON (p.place_type)",
                "CREATE INDEX place_function_index IF NOT EXISTS FOR (p:Place) ON (p.place_function)",

                # Geometry role index
                "CREATE INDEX geometry_role_index IF NOT EXISTS FOR (g:Geometry) ON (g.geometry_role)",
            ]

            for index in tqdm(indexes, desc="Creating indexes"):
                try:
                    session.run(index)
                except Exception as e:
                    print(f"⚠️  Index may already exist: {e}")

        print("✅ Constraints and indexes created")

    def import_hierarchies(self, hierarchies: List[Dict[str, Any]]):
        """Import Hierarchy nodes."""
        print(f"🗂️  Importing {len(hierarchies)} hierarchies...")

        query = """
        UNWIND $hierarchies AS h
        CREATE (hierarchy:Hierarchy {
            hierarchy_id: h.hierarchy_id,
            hierarchy_name: h.hierarchy_name,
            hierarchy_levels: h.hierarchy_levels,
            units_number: h.units_number
        })
        """

        with self.driver.session() as session:
            session.run(query, hierarchies=hierarchies)

        print(f"✅ Imported {len(hierarchies)} hierarchies")

    def import_units(self, units: List[Dict[str, Any]], hierarchy_type: str = "Admin"):
        """
        Import Unit nodes in batches.

        Args:
            units: List of unit dictionaries
            hierarchy_type: Type of hierarchy (Admin, Electoral, Postal)
        """
        print(f"🏢 Importing {len(units)} units ({hierarchy_type})...")

        # Determine additional label based on hierarchy type
        if hierarchy_type == "Admin":
            label = "AdminUnit"
        elif hierarchy_type == "Electoral":
            label = "ElectoralUnit"
        elif hierarchy_type == "Postal":
            label = "PostalUnit"
        else:
            label = "Unit"

        query = f"""
        UNWIND $batch AS unit
        CREATE (u:Unit:{label} {{
            spatial_unit_id: unit.spatial_unit_id,
            unit_name: unit.unit_name,
            unit_type: unit.unit_type,
            unit_level: unit.unit_level,
            unit_h3: unit.unit_h3
        }})
        """

        self._batch_import(units, query, "units")

    def import_places(self, places: List[Dict[str, Any]]):
        """Import Place nodes in batches."""
        print(f"📍 Importing {len(places)} places...")

        query = """
        UNWIND $batch AS place
        CREATE (p:Place {
            place_id: place.place_id,
            place_name: place.place_name,
            place_type: place.place_type,
            place_function: place.place_function,
            place_key: place.place_key,
            place_level: place.place_level,
            place_h3: place.place_h3,
            place_s2: place.place_s2,
            model_source: place.model_source,
            geometry_source: place.geometry_source
        })
        """

        self._batch_import(places, query, "places")

    def import_geometries(self, geometries: List[Dict[str, Any]]):
        """Import Geometry nodes in batches."""
        print(f"🗺️  Importing {len(geometries)} geometries...")

        query = """
        UNWIND $batch AS geom
        MERGE (g:Geometry {geometry_id: geom.geometry_id})
        ON CREATE SET
            g.geometry_role = geom.geometry_role,
            g.geometry_type = geom.geometry_type,
            g.wkt = geom.wkt,
            g.latitude = geom.latitude,
            g.longitude = geom.longitude
        ON MATCH SET
            g.geometry_role = geom.geometry_role,
            g.geometry_type = geom.geometry_type,
            g.wkt = geom.wkt,
            g.latitude = geom.latitude,
            g.longitude = geom.longitude
        WITH g
        CALL apoc.do.when(
            g.geometry_type = 'POINT',
            'SET g:PointGeometry RETURN g',
            'SET g:PolygonGeometry RETURN g',
            {g: g}
        ) YIELD value
        RETURN value
        """

        # Try with APOC first, fallback to simple import if APOC not available
        try:
            self._batch_import(geometries, query, "geometries")
        except Exception as e:
            print(f"⚠️  APOC not available, using simple import: {e}")

            # Fallback query without APOC
            simple_query = """
            UNWIND $batch AS geom
            MERGE (g:Geometry {geometry_id: geom.geometry_id})
            ON CREATE SET
                g.geometry_role = geom.geometry_role,
                g.geometry_type = geom.geometry_type,
                g.wkt = geom.wkt,
                g.latitude = geom.latitude,
                g.longitude = geom.longitude
            ON MATCH SET
                g.geometry_role = geom.geometry_role,
                g.geometry_type = geom.geometry_type,
                g.wkt = geom.wkt,
                g.latitude = geom.latitude,
                g.longitude = geom.longitude
            """
            self._batch_import(geometries, simple_query, "geometries")

    def import_relationships(self, relationships: List[Dict[str, Any]]):
        """Import relationships in batches grouped by type."""
        print(f"🔗 Importing {len(relationships)} relationships...")

        # Group relationships by type for efficient batching
        rel_by_type = {}
        for rel in relationships:
            rel_type = rel['type']
            if rel_type not in rel_by_type:
                rel_by_type[rel_type] = []
            rel_by_type[rel_type].append(rel)

        # Import each relationship type
        for rel_type, rels in tqdm(rel_by_type.items(), desc="Relationship types"):
            self._import_relationships_by_type(rels, rel_type)

    def _import_relationships_by_type(self, relationships: List[Dict[str, Any]], rel_type: str):
        """Import relationships of a specific type."""

        # Different queries based on relationship type
        if rel_type == "CONTAINED_BY":
            query = """
            UNWIND $batch AS rel
            MATCH (child:Unit) WHERE child.spatial_unit_id = rel.from_id
            MATCH (parent:Unit) WHERE parent.spatial_unit_id = rel.to_id
            CREATE (child)-[:CONTAINED_BY]->(parent)
            """

        elif rel_type == "BELONGS_TO_HIERARCHY":
            query = """
            UNWIND $batch AS rel
            MATCH (u:Unit) WHERE u.spatial_unit_id = rel.from_id
            MATCH (h:Hierarchy) WHERE h.hierarchy_id = rel.to_id
            CREATE (u)-[:BELONGS_TO_HIERARCHY]->(h)
            """

        elif rel_type == "CONTAINED_BY_UNIT":
            query = """
            UNWIND $batch AS rel
            MATCH (p:Place) WHERE p.place_id = rel.from_id
            MATCH (u:Unit) WHERE u.spatial_unit_id = rel.to_id
            CREATE (p)-[:CONTAINED_BY_UNIT]->(u)
            """

        elif rel_type == "BASE_PLACE_PARENT":
            query = """
            UNWIND $batch AS rel
            MATCH (child:Place) WHERE child.place_id = rel.from_id
            MATCH (parent:Place) WHERE parent.place_id = rel.to_id
            CREATE (child)-[:BASE_PLACE_PARENT]->(parent)
            """

        elif rel_type in ["NORTH_OF", "SOUTH_OF", "EAST_OF", "WEST_OF"]:
            query = f"""
            UNWIND $batch AS rel
            MATCH (from) WHERE from.spatial_unit_id = rel.from_id OR from.place_id = rel.from_id
            MATCH (to) WHERE to.spatial_unit_id = rel.to_id OR to.place_id = rel.to_id
            CREATE (from)-[:{rel_type}]->(to)
            """

        elif rel_type == "HAS_MAIN_GEOMETRY":
            query = """
            UNWIND $batch AS rel
            MATCH (entity) WHERE entity.spatial_unit_id = rel.from_id OR entity.place_id = rel.from_id
            MATCH (g:Geometry) WHERE g.geometry_id = split(rel.to_uri, '/')[-1]
            CREATE (entity)-[:HAS_MAIN_GEOMETRY]->(g)
            """

        elif rel_type == "HAS_EXTRA_GEOMETRY":
            query = """
            UNWIND $batch AS rel
            MATCH (entity) WHERE entity.spatial_unit_id = rel.from_id OR entity.place_id = rel.from_id
            MATCH (g:Geometry) WHERE g.geometry_id = split(rel.to_uri, '/')[-1]
            CREATE (entity)-[:HAS_EXTRA_GEOMETRY]->(g)
            """

        else:
            print(f"⚠️  Unknown relationship type: {rel_type}")
            return

        self._batch_import(relationships, query, f"{rel_type} relationships")

    def _batch_import(self, data: List[Dict], query: str, description: str):
        """
        Generic batch import function.

        Args:
            data: List of dictionaries to import
            query: Cypher query with $batch parameter
            description: Description for progress bar
        """
        total_batches = (len(data) + self.batch_size - 1) // self.batch_size

        with self.driver.session() as session:
            for i in tqdm(range(0, len(data), self.batch_size),
                         total=total_batches,
                         desc=f"Importing {description}"):
                batch = data[i:i + self.batch_size]
                session.run(query, batch=batch)

    def create_inverse_relationships(self):
        """Create inverse relationships for easier traversal."""
        print("🔄 Creating inverse relationships...")

        with self.driver.session() as session:
            # HAS_CHILD_UNIT (inverse of CONTAINED_BY)
            session.run("""
                MATCH (child:Unit)-[:CONTAINED_BY]->(parent:Unit)
                WHERE NOT (parent)-[:HAS_CHILD_UNIT]->(child)
                CREATE (parent)-[:HAS_CHILD_UNIT]->(child)
            """)

            # CHILD_OF_UNIT (inverse of CONTAINED_BY_UNIT)
            session.run("""
                MATCH (p:Place)-[:CONTAINED_BY_UNIT]->(u:Unit)
                WHERE NOT (u)-[:CHILD_OF_UNIT]->(p)
                CREATE (u)-[:CHILD_OF_UNIT]->(p)
            """)

            # BASE_PLACE_CHILD (inverse of BASE_PLACE_PARENT)
            session.run("""
                MATCH (child:Place)-[:BASE_PLACE_PARENT]->(parent:Place)
                WHERE NOT (parent)-[:BASE_PLACE_CHILD]->(child)
                CREATE (parent)-[:BASE_PLACE_CHILD]->(child)
            """)

        print("✅ Inverse relationships created")

    def get_database_stats(self) -> Dict[str, int]:
        """Get statistics about the current database state."""
        with self.driver.session() as session:
            # Count nodes by label
            labels_result = session.run("""
                CALL db.labels() YIELD label
                CALL apoc.cypher.run('MATCH (n:`' + label + '`) RETURN count(n) as count', {})
                YIELD value
                RETURN label, value.count as count
            """)

            # Fallback if APOC not available
            try:
                stats = {row['label']: row['count'] for row in labels_result}
            except:
                # Manual count
                stats = {}
                result = session.run("MATCH (u:Unit) RETURN count(u) as count")
                stats['Unit'] = result.single()['count']

                result = session.run("MATCH (p:Place) RETURN count(p) as count")
                stats['Place'] = result.single()['count']

                result = session.run("MATCH (h:Hierarchy) RETURN count(h) as count")
                stats['Hierarchy'] = result.single()['count']

                result = session.run("MATCH (g:Geometry) RETURN count(g) as count")
                stats['Geometry'] = result.single()['count']

            # Count relationships
            rel_result = session.run("""
                MATCH ()-[r]->()
                RETURN count(r) as count
            """)
            stats['Total Relationships'] = rel_result.single()['count']

            return stats


if __name__ == "__main__":
    # Test connection
    print("Testing Neo4j Importer...")

    # Example usage
    importer = Neo4jImporter("bolt://localhost:7687", "neo4j", "password")

    try:
        # Test connection and create schema
        importer.create_constraints_and_indexes()
        print("✅ Neo4j connection successful!")

        # Get current stats
        stats = importer.get_database_stats()
        print("\n📊 Current Database Stats:")
        for label, count in stats.items():
            print(f"  {label}: {count}")

    finally:
        importer.close()