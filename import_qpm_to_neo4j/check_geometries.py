#!/usr/bin/env python3
"""
Check geometry relationships in the database
"""
import os
from dotenv import load_dotenv
from neo4j import GraphDatabase

load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "neo4j")

def check_geometries():
    """Check geometry storage and relationships"""
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    
    try:
        with driver.session() as session:
            print("\n" + "="*60)
            print("🗺️  Geometry Storage Analysis")
            print("="*60)
            
            # 1. Count geometries by type
            print("\n📊 Geometry Counts:")
            result = session.run("""
                MATCH (g:Geometry)
                RETURN labels(g) as labels, count(g) as count
                ORDER BY count DESC
            """)
            for record in result:
                print(f"  {', '.join(record['labels'])}: {record['count']:,}")
            
            # 2. Check what relationship types connect to geometries
            print("\n🔗 Relationships TO Geometries:")
            result = session.run("""
                MATCH ()-[r]->(g:Geometry)
                RETURN type(r) as rel_type, count(r) as count
                ORDER BY count DESC
            """)
            found = False
            for record in result:
                found = True
                print(f"  {record['rel_type']}: {record['count']:,}")
            if not found:
                print("  ❌ No relationships found pointing TO geometries")
            
            # 3. Check what relationship types come from geometries
            print("\n🔗 Relationships FROM Geometries:")
            result = session.run("""
                MATCH (g:Geometry)-[r]->()
                RETURN type(r) as rel_type, count(r) as count
                ORDER BY count DESC
            """)
            found = False
            for record in result:
                found = True
                print(f"  {record['rel_type']}: {record['count']:,}")
            if not found:
                print("  ❌ No relationships found coming FROM geometries")
            
            # 4. Check all relationships involving geometries (either direction)
            print("\n🔗 All Relationships involving Geometries:")
            result = session.run("""
                MATCH (g:Geometry)-[r]-()
                RETURN type(r) as rel_type, 
                       startNode(r).place_name as start_name,
                       startNode(r).unit_name as start_unit,
                       endNode(r).place_name as end_name,
                       endNode(r).unit_name as end_unit,
                       labels(startNode(r)) as start_labels,
                       labels(endNode(r)) as end_labels
                LIMIT 10
            """)
            records = list(result)
            if records:
                print(f"  Found {len(records)} example relationships:\n")
                for i, record in enumerate(records, 1):
                    start_labels = ', '.join([l for l in record['start_labels'] if l != 'Geometry'])
                    end_labels = ', '.join([l for l in record['end_labels'] if l != 'Geometry'])
                    start = record['start_name'] or record['start_unit'] or start_labels or 'Unknown'
                    end = record['end_name'] or record['end_unit'] or end_labels or 'Unknown'
                    print(f"  {i}. [{start}] --{record['rel_type']}--> [{end}]")
            else:
                print("  ⚠️  No relationships found involving geometries!")
            
            # 5. Check Units with geometries
            print("\n🏢 Units with Geometry Properties:")
            result = session.run("""
                MATCH (u:Unit)
                WHERE u.latitude IS NOT NULL OR u.longitude IS NOT NULL OR u.wkt IS NOT NULL
                RETURN u.unit_name as name,
                       u.latitude as lat,
                       u.longitude as lon,
                       u.wkt as wkt
                LIMIT 5
            """)
            records = list(result)
            if records:
                print(f"  Found {len(records)} units with geometry properties:\n")
                for record in records:
                    print(f"  - {record['name']}")
                    if record['lat']:
                        print(f"    Lat/Lon: {record['lat']}, {record['lon']}")
                    if record['wkt']:
                        wkt_preview = record['wkt'][:50] + "..." if len(record['wkt']) > 50 else record['wkt']
                        print(f"    WKT: {wkt_preview}")
            else:
                print("  ❌ No units have geometry properties stored directly")
            
            # 6. Check Places with geometries
            print("\n📍 Places with Geometry Properties:")
            result = session.run("""
                MATCH (p:Place)
                WHERE p.latitude IS NOT NULL OR p.longitude IS NOT NULL OR p.wkt IS NOT NULL
                RETURN p.place_name as name,
                       p.latitude as lat,
                       p.longitude as lon,
                       p.wkt as wkt
                LIMIT 5
            """)
            records = list(result)
            if records:
                print(f"  Found {len(records)} places with geometry properties:\n")
                for record in records:
                    print(f"  - {record['name']}")
                    if record['lat']:
                        print(f"    Lat/Lon: {record['lat']}, {record['lon']}")
                    if record['wkt']:
                        wkt_preview = record['wkt'][:50] + "..." if len(record['wkt']) > 50 else record['wkt']
                        print(f"    WKT: {wkt_preview}")
            else:
                print("  ❌ No places have geometry properties stored directly")
            
            # 7. Sample geometry nodes with their properties
            print("\n🗺️  Sample Geometry Nodes:")
            result = session.run("""
                MATCH (g:Geometry)
                RETURN g.geometry_id as id,
                       g.geometry_role as role,
                       g.geometry_type as type,
                       g.latitude as lat,
                       g.longitude as lon,
                       labels(g) as labels
                LIMIT 5
            """)
            for record in result:
                labels_str = ', '.join(record['labels'])
                print(f"\n  Geometry ID: {record['id']}")
                print(f"    Labels: {labels_str}")
                print(f"    Role: {record['role']}")
                print(f"    Type: {record['type']}")
                if record['lat']:
                    print(f"    Coordinates: ({record['lat']}, {record['lon']})")
            
            # 8. Try to find pattern: what connects to geometries?
            print("\n🔍 Investigating Geometry Connections:")
            result = session.run("""
                MATCH (n)-[r]-(g:Geometry)
                WITH labels(n) as node_labels, type(r) as rel_type, count(*) as count
                RETURN node_labels, rel_type, count
                ORDER BY count DESC
                LIMIT 10
            """)
            records = list(result)
            if records:
                print("  Found connections:")
                for record in records:
                    labels_str = ', '.join(record['node_labels'])
                    print(f"    {labels_str} --[{record['rel_type']}]-- Geometry: {record['count']:,}")
            else:
                print("  ❌ Geometries appear to be isolated nodes!")
            
            # 9. Check geometry_id pattern
            print("\n🔎 Geometry ID Patterns:")
            result = session.run("""
                MATCH (g:Geometry)
                RETURN g.geometry_id as id
                LIMIT 10
            """)
            for i, record in enumerate(result, 1):
                print(f"  {i}. {record['id']}")
            
            print("\n" + "="*60)
            print("✅ Geometry analysis complete!")
            print("="*60)
            
    finally:
        driver.close()

if __name__ == "__main__":
    check_geometries()
