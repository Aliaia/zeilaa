#!/usr/bin/env python3
"""
Check Neo4j database contents
"""
import os
from dotenv import load_dotenv
from neo4j import GraphDatabase

# Load environment variables
load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "neo4j")

def check_database():
    """Check database contents"""
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    
    try:
        with driver.session() as session:
            print("=" * 60)
            print("📊 Neo4j Database Statistics")
            print("=" * 60)
            
            # Count nodes by label
            print("\n📦 Node Counts:")
            labels = session.run("CALL db.labels()").value()
            for label in sorted(labels):
                count = session.run(f"MATCH (n:{label}) RETURN count(n) as count").single()['count']
                print(f"  {label}: {count:,}")
            
            # Count relationships by type
            print("\n🔗 Relationship Counts:")
            result = session.run("""
                MATCH ()-[r]->()
                RETURN type(r) as relType, count(r) as count
                ORDER BY relType
            """)
            for record in result:
                print(f"  {record['relType']}: {record['count']:,}")
            
            # Sample some data
            print("\n📍 Sample Places (first 5):")
            result = session.run("""
                MATCH (p:Place)
                RETURN p.place_name as name, p.place_id as id
                LIMIT 5
            """)
            for record in result:
                print(f"  - {record['name']} (ID: {record['id']})")
            
            # Sample units
            print("\n🏢 Sample Units (first 5):")
            result = session.run("""
                MATCH (u:Unit)
                RETURN u.unit_name as name, u.unit_id as id, labels(u) as labels
                LIMIT 5
            """)
            for record in result:
                labels_str = ", ".join([l for l in record['labels'] if l != 'Unit'])
                print(f"  - {record['name']} (ID: {record['id']}) [{labels_str}]")
            
            # Check hierarchies
            print("\n🗂️  Hierarchies:")
            result = session.run("""
                MATCH (h:Hierarchy)
                RETURN h.hierarchy_name as name, h.hierarchy_id as id
                ORDER BY h.hierarchy_name
            """)
            for record in result:
                print(f"  - {record['name']} (ID: {record['id']})")
            
            # Sample place with geometry
            print("\n🗺️  Sample Place with Geometry:")
            result = session.run("""
                MATCH (p:Place)-[:HAS_MAIN_GEOMETRY]->(g:Geometry)
                RETURN p.place_name as name, g.latitude as lat, g.longitude as lon
                LIMIT 3
            """)
            for record in result:
                print(f"  - {record['name']}: ({record['lat']}, {record['lon']})")
            
            print("\n" + "=" * 60)
            print("✅ Database check complete!")
            print("=" * 60)
            
    finally:
        driver.close()

if __name__ == "__main__":
    check_database()
