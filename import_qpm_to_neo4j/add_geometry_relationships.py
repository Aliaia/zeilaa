#!/usr/bin/env python3
"""
Create missing geometry relationships
"""
import os
from dotenv import load_dotenv
from neo4j import GraphDatabase
from ttl_parser import QPMParser

load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "neo4j")

def add_geometry_relationships():
    """Add the missing HAS_MAIN_GEOMETRY and HAS_EXTRA_GEOMETRY relationships"""
    
    print("\n🔧 Adding geometry relationships...")
    
    # Parse the files to get the relationships
    parser = QPMParser()
    parser.parse_file('../Hierarchy_Full_with_names_and_places/Admin_Hierarchy.ttl')
    rels = parser.extract_relationships()
    geom_rels = [r for r in rels if 'GEOMETRY' in r['type']]
    
    print(f"Found {len(geom_rels)} geometry relationships from hierarchy file")
    
    # Also parse places file
    parser2 = QPMParser()
    parser2.parse_file('../Hierarchy_Full_with_names_and_places/Admin_Full_places52.ttl')
    place_rels = parser2.extract_relationships()
    place_geom_rels = [r for r in place_rels if 'GEOMETRY' in r['type']]
    
    print(f"Found {len(place_geom_rels)} geometry relationships from places file")
    
    all_geom_rels = geom_rels + place_geom_rels
    print(f"Total: {len(all_geom_rels)} geometry relationships to create")
    
    # Connect to Neo4j
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    
    try:
        with driver.session() as session:
            # Create HAS_MAIN_GEOMETRY relationships
            main_geom_rels = [r for r in all_geom_rels if r['type'] == 'HAS_MAIN_GEOMETRY']
            print(f"\n📍 Creating {len(main_geom_rels)} HAS_MAIN_GEOMETRY relationships...")
            
            query = """
            UNWIND $batch AS rel
            MATCH (entity) WHERE entity.spatial_unit_id = rel.from_id OR entity.place_id = rel.from_id
            MATCH (g:Geometry) WHERE g.geometry_id = split(rel.to_uri, '/')[-1]
            MERGE (entity)-[:HAS_MAIN_GEOMETRY]->(g)
            """
            
            # Process in batches
            batch_size = 1000
            for i in range(0, len(main_geom_rels), batch_size):
                batch = main_geom_rels[i:i+batch_size]
                session.run(query, batch=batch)
                print(f"  Processed {min(i+batch_size, len(main_geom_rels))}/{len(main_geom_rels)}")
            
            # Create HAS_EXTRA_GEOMETRY relationships
            extra_geom_rels = [r for r in all_geom_rels if r['type'] == 'HAS_EXTRA_GEOMETRY']
            print(f"\n📍 Creating {len(extra_geom_rels)} HAS_EXTRA_GEOMETRY relationships...")
            
            query = """
            UNWIND $batch AS rel
            MATCH (entity) WHERE entity.spatial_unit_id = rel.from_id OR entity.place_id = rel.from_id
            MATCH (g:Geometry) WHERE g.geometry_id = split(rel.to_uri, '/')[-1]
            MERGE (entity)-[:HAS_EXTRA_GEOMETRY]->(g)
            """
            
            for i in range(0, len(extra_geom_rels), batch_size):
                batch = extra_geom_rels[i:i+batch_size]
                session.run(query, batch=batch)
                print(f"  Processed {min(i+batch_size, len(extra_geom_rels))}/{len(extra_geom_rels)}")
            
            # Verify
            print("\n✅ Verifying...")
            result = session.run("""
                MATCH ()-[r:HAS_MAIN_GEOMETRY]->()
                RETURN count(r) as count
            """)
            main_count = result.single()['count']
            
            result = session.run("""
                MATCH ()-[r:HAS_EXTRA_GEOMETRY]->()
                RETURN count(r) as count
            """)
            extra_count = result.single()['count']
            
            print(f"✅ Created {main_count:,} HAS_MAIN_GEOMETRY relationships")
            print(f"✅ Created {extra_count:,} HAS_EXTRA_GEOMETRY relationships")
            
    finally:
        driver.close()

if __name__ == "__main__":
    add_geometry_relationships()
