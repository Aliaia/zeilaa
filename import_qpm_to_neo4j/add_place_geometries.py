#!/usr/bin/env python3
"""
Add place geometries from QPM_Place_Graph_populated_Wales.ttl
Only imports HAS_MAIN_GEOMETRY and HAS_EXTRA_GEOMETRY relationships
"""

import os
from dotenv import load_dotenv
from ttl_parser import QPMParser
from neo4j_importer import Neo4jImporter


def main():
    load_dotenv()
    
    print("="*60)
    print("📍 Adding Place Geometries")
    print("="*60)
    
    # Initialize connections
    importer = Neo4jImporter(
        os.getenv('NEO4J_URI', 'bolt://localhost:7687'),
        os.getenv('NEO4J_USER', 'neo4j'),
        os.getenv('NEO4J_PASSWORD', 'password')
    )
    
    try:
        # Parse place geometry file
        place_geom_file = os.getenv('ADMIN_PLACE_GEOMETRY_FILE', 
                                     '../QPM_Place_Graph_populated_Wales.ttl')
        
        print(f"\n📖 Parsing {place_geom_file}...")
        parser = QPMParser()
        parser.parse_file(place_geom_file)
        
        # Extract geometries
        geometries = parser.extract_geometries()
        print(f"✅ Found {len(geometries)} geometries")
        
        # Import geometries
        if geometries:
            print(f"\n🗺️  Importing geometries...")
            importer.import_geometries(geometries)
        
        # Extract ALL relationships
        all_relationships = parser.extract_relationships()
        print(f"✅ Found {len(all_relationships)} total relationships")
        
        # Filter to ONLY geometry relationships
        geom_relationships = [
            rel for rel in all_relationships 
            if rel['type'] in ('HAS_MAIN_GEOMETRY', 'HAS_EXTRA_GEOMETRY')
        ]
        print(f"✅ Filtered to {len(geom_relationships)} geometry relationships")
        
        # Import ONLY the geometry relationships
        if geom_relationships:
            print(f"\n🔗 Importing {len(geom_relationships)} geometry relationships...")
            importer.import_relationships(geom_relationships)
        
        print("\n✅ Place geometries added successfully!")
        
        # Verify
        print("\n📊 Verification:")
        with importer.driver.session() as session:
            result = session.run("""
                MATCH (p:Place)-[:HAS_MAIN_GEOMETRY]->()
                RETURN count(DISTINCT p) as count
            """)
            main_count = result.single()['count']
            
            result = session.run("""
                MATCH (p:Place)-[:HAS_EXTRA_GEOMETRY]->()
                RETURN count(DISTINCT p) as count
            """)
            extra_count = result.single()['count']
            
            print(f"  Places with main geometry: {main_count:,}")
            print(f"  Places with extra geometry: {extra_count:,}")
        
    finally:
        importer.close()


if __name__ == "__main__":
    main()
