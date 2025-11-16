#!/usr/bin/env python3
"""
Verify APOC is installed
"""
import os
from dotenv import load_dotenv
from neo4j import GraphDatabase

load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "neo4j")

def verify_apoc():
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    
    try:
        with driver.session() as session:
            # Try to use a simple APOC function
            try:
                result = session.run("RETURN apoc.version() as version")
                version = result.single()['version']
                print(f"✅ APOC is installed! Version: {version}")
            except Exception as e:
                if "apoc" in str(e).lower():
                    print(f"❌ APOC is NOT installed or not working.")
                    print(f"   Error: {e}")
                else:
                    print(f"⚠️  Could not verify APOC: {e}")
                    print("\nTrying alternative method...")
                    
                    # Try listing procedures with SHOW
                    try:
                        result = session.run("SHOW PROCEDURES YIELD name WHERE name STARTS WITH 'apoc' RETURN count(name) as count")
                        count = result.single()['count']
                        if count > 0:
                            print(f"✅ APOC is installed! Found {count} APOC procedures.")
                        else:
                            print("❌ APOC procedures not found.")
                    except Exception as e2:
                        print(f"❌ Alternative check also failed: {e2}")
                
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
    finally:
        driver.close()

if __name__ == "__main__":
    verify_apoc()
