#!/usr/bin/env python3
"""
Sample queries to explore the QPM database
"""
import os
from dotenv import load_dotenv
from neo4j import GraphDatabase

load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "neo4j")

def run_query(session, title, query, limit=10):
    """Run a query and display results"""
    print(f"\n{'='*60}")
    print(f"🔍 {title}")
    print(f"{'='*60}")
    print(f"Query: {query}\n")
    
    try:
        result = session.run(query)
        records = list(result)
        
        if not records:
            print("No results found.")
            return
        
        # Print results
        for i, record in enumerate(records[:limit], 1):
            print(f"{i}. {dict(record)}")
        
        if len(records) > limit:
            print(f"\n... and {len(records) - limit} more results")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def explore_database():
    """Run sample queries to explore the database"""
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    
    try:
        with driver.session() as session:
            print("\n" + "="*60)
            print("🗺️  QPM Database Exploration")
            print("="*60)
            
            # 1. Find places by name
            run_query(session, 
                "Find places with 'Cardiff' in the name",
                """
                MATCH (p:Place)
                WHERE p.place_name CONTAINS 'Cardiff'
                RETURN p.place_name as name, p.place_id as id
                LIMIT 10
                """)
            
            # 2. Find units and their hierarchies
            run_query(session,
                "Administrative units and their hierarchies",
                """
                MATCH (u:AdminUnit)-[:BELONGS_TO_HIERARCHY]->(h:Hierarchy)
                RETURN u.unit_name as unit, h.hierarchy_name as hierarchy
                LIMIT 10
                """)
            
            # 3. Find containment relationships
            run_query(session,
                "Units containing other units (hierarchy)",
                """
                MATCH (child:AdminUnit)-[:CONTAINED_BY]->(parent:AdminUnit)
                RETURN child.unit_name as child_unit, 
                       parent.unit_name as parent_unit
                LIMIT 10
                """)
            
            # 4. Find places contained in units
            run_query(session,
                "Places and the units they belong to",
                """
                MATCH (p:Place)-[:CONTAINED_BY_UNIT]->(u:AdminUnit)
                RETURN p.place_name as place, 
                       u.unit_name as unit
                LIMIT 10
                """)
            
            # 5. Spatial relationships
            run_query(session,
                "Places and their spatial relationships (NORTH_OF)",
                """
                MATCH (p1:Place)-[:NORTH_OF]->(p2:Place)
                RETURN p1.place_name as place1, 
                       p2.place_name as place2
                LIMIT 10
                """)
            
            # 6. Find geometries with coordinates
            run_query(session,
                "Places with point geometries",
                """
                MATCH (p:Place)-[:CONTAINED_BY_UNIT]->(u:AdminUnit)
                MATCH (p)-[]-(g:PointGeometry)
                WHERE g.latitude IS NOT NULL AND g.longitude IS NOT NULL
                RETURN p.place_name as place,
                       u.unit_name as unit,
                       g.latitude as lat, 
                       g.longitude as lon
                LIMIT 10
                """)
            
            # 7. Find units with most places
            run_query(session,
                "Top 10 units by number of places",
                """
                MATCH (p:Place)-[:CONTAINED_BY_UNIT]->(u:AdminUnit)
                WITH u, count(p) as place_count
                RETURN u.unit_name as unit, place_count
                ORDER BY place_count DESC
                LIMIT 10
                """)
            
            # 8. Geographic extent query
            run_query(session,
                "Geographic extent (min/max coordinates)",
                """
                MATCH (g:PointGeometry)
                WHERE g.latitude IS NOT NULL AND g.longitude IS NOT NULL
                RETURN min(g.latitude) as min_lat,
                       max(g.latitude) as max_lat,
                       min(g.longitude) as min_lon,
                       max(g.longitude) as max_lon
                """)
            
            # 9. Check hierarchy depth
            run_query(session,
                "Administrative hierarchy depth (up to 5 levels)",
                """
                MATCH path = (child:AdminUnit)-[:CONTAINED_BY*1..5]->(root:AdminUnit)
                WHERE NOT (root)-[:CONTAINED_BY]->()
                WITH child, root, length(path) as depth
                ORDER BY depth DESC
                RETURN child.unit_name as child_unit,
                       root.unit_name as root_unit,
                       depth
                LIMIT 10
                """)
            
            # 10. Relationship type counts
            run_query(session,
                "Relationship types and their counts",
                """
                MATCH ()-[r]->()
                RETURN type(r) as relationship_type, count(r) as count
                ORDER BY count DESC
                """)
            
            print("\n" + "="*60)
            print("✅ Database exploration complete!")
            print("="*60)
            print("\nYou can also run these queries in Neo4j Browser")
            print("for visual graph exploration!")
            
    finally:
        driver.close()

if __name__ == "__main__":
    explore_database()
