#!/usr/bin/env python3
"""
Main script to import all QPM hierarchies into Neo4j
Orchestrates the full import process for Admin, Electoral, and Postal hierarchies
"""

import os
import sys
import argparse
from dotenv import load_dotenv
from pathlib import Path
import time

from ttl_parser import QPMParser
from neo4j_importer import Neo4jImporter


def load_config():
    """Load configuration from .env file"""
    # Load .env file
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        load_dotenv(env_path)
    else:
        print("⚠️  No .env file found. Using defaults or environment variables.")

    config = {
        'neo4j_uri': os.getenv('NEO4J_URI', 'bolt://localhost:7687'),
        'neo4j_user': os.getenv('NEO4J_USER', 'neo4j'),
        'neo4j_password': os.getenv('NEO4J_PASSWORD', 'password'),
        'batch_size': int(os.getenv('BATCH_SIZE', '1000')),
        'clear_db': os.getenv('CLEAR_DB_BEFORE_IMPORT', 'false').lower() == 'true',
    }

    return config


def import_hierarchy(parser: QPMParser, importer: Neo4jImporter,
                     hierarchy_file: str, places_file: str,
                     hierarchy_type: str):
    """
    Import a single hierarchy (Admin, Electoral, or Postal).

    Args:
        parser: QPMParser instance
        importer: Neo4jImporter instance
        hierarchy_file: Path to hierarchy TTL file
        places_file: Path to places TTL file (optional)
        hierarchy_type: Type of hierarchy ("Admin", "Electoral", "Postal")
    """
    print(f"\n{'='*60}")
    print(f"📦 Importing {hierarchy_type} Hierarchy")
    print(f"{'='*60}\n")

    start_time = time.time()

    # Parse hierarchy file
    print(f"📖 Parsing {hierarchy_type} hierarchy file...")
    parser.parse_file(hierarchy_file)

    # Extract data
    hierarchies = parser.extract_hierarchies()
    units = parser.extract_units()
    geometries = parser.extract_geometries()
    relationships = parser.extract_relationships()

    # Import into Neo4j
    print(f"\n💾 Importing {hierarchy_type} data into Neo4j...")

    # Import hierarchies (only once)
    if hierarchies:
        importer.import_hierarchies(hierarchies)

    # Import units with hierarchy-specific label
    if units:
        importer.import_units(units, hierarchy_type)

    # Import geometries
    if geometries:
        importer.import_geometries(geometries)

    # Import relationships
    if relationships:
        importer.import_relationships(relationships)

    # Parse and import places if provided
    if places_file and os.path.exists(places_file):
        print(f"\n📖 Parsing {hierarchy_type} places file...")
        parser.graph.parse(places_file, format='turtle')

        places = parser.extract_places()
        place_geoms = parser.extract_geometries()
        place_rels = parser.extract_relationships()

        if places:
            importer.import_places(places)

        if place_geoms:
            importer.import_geometries(place_geoms)

        if place_rels:
            importer.import_relationships(place_rels)

    elapsed = time.time() - start_time
    print(f"\n✅ {hierarchy_type} hierarchy imported in {elapsed:.2f} seconds")


def main():
    """Main import orchestration"""
    parser = argparse.ArgumentParser(
        description='Import QPM ontology data into Neo4j'
    )
    parser.add_argument(
        '--clear-db',
        action='store_true',
        help='Clear database before import (DANGEROUS!)'
    )
    parser.add_argument(
        '--hierarchy',
        choices=['admin', 'electoral', 'postal', 'all'],
        default='all',
        help='Which hierarchy to import'
    )
    parser.add_argument(
        '--ontology',
        type=str,
        help='Path to QPM ontology file (optional, for reference)'
    )

    args = parser.parse_args()

    # Load configuration
    config = load_config()

    # Override clear_db if specified in args
    if args.clear_db:
        config['clear_db'] = True

    print("="*60)
    print("🚀 QPM Data Import to Neo4j")
    print("="*60)
    print(f"\n📋 Configuration:")
    print(f"  Neo4j URI: {config['neo4j_uri']}")
    print(f"  Neo4j User: {config['neo4j_user']}")
    print(f"  Batch Size: {config['batch_size']}")
    print(f"  Clear DB: {config['clear_db']}")
    print(f"  Hierarchy: {args.hierarchy}")

    if config['clear_db']:
        response = input("\n⚠️  WARNING: This will DELETE ALL DATA in the database. Continue? (yes/no): ")
        if response.lower() != 'yes':
            print("❌ Import cancelled.")
            return

    # Initialize connections
    print("\n🔌 Connecting to Neo4j...")
    importer = Neo4jImporter(
        config['neo4j_uri'],
        config['neo4j_user'],
        config['neo4j_password']
    )
    importer.batch_size = config['batch_size']

    try:
        # Clear database if requested
        if config['clear_db']:
            importer.clear_database(confirm=True)

        # Create schema (constraints and indexes)
        print("\n📐 Setting up database schema...")
        importer.create_constraints_and_indexes()

        # Determine which hierarchies to import
        hierarchies_to_import = []

        if args.hierarchy in ['admin', 'all']:
            hierarchies_to_import.append({
                'type': 'Admin',
                'hierarchy_file': os.getenv('ADMIN_HIERARCHY_FILE',
                                           '../Hierarchy_Full_with_names_and_places/Admin_Hierarchy.ttl'),
                'places_file': os.getenv('ADMIN_PLACES_FILE',
                                        '../Hierarchy_Full_with_names_and_places/Admin_Full_places52.ttl')
            })

        if args.hierarchy in ['electoral', 'all']:
            hierarchies_to_import.append({
                'type': 'Electoral',
                'hierarchy_file': os.getenv('ELECTORAL_HIERARCHY_FILE',
                                           '../Hierarchy_Full_with_names_and_places/Electoral Hierarchy.ttl'),
                'places_file': None  # Electoral places in same file
            })

        if args.hierarchy in ['postal', 'all']:
            hierarchies_to_import.append({
                'type': 'Postal',
                'hierarchy_file': os.getenv('POSTAL_HIERARCHY_FILE',
                                           '../Hierarchy_Full_with_names_and_places/Postal_hierarchy.ttl'),
                'places_file': None  # Postal places in same file
            })

        # Import each hierarchy
        total_start = time.time()

        for hierarchy in hierarchies_to_import:
            # Create a fresh parser for each hierarchy
            qpm_parser = QPMParser()

            import_hierarchy(
                qpm_parser,
                importer,
                hierarchy['hierarchy_file'],
                hierarchy['places_file'],
                hierarchy['type']
            )

        # Create inverse relationships for easier querying
        print("\n🔄 Creating inverse relationships...")
        importer.create_inverse_relationships()

        # Print final statistics
        print("\n" + "="*60)
        print("📊 Import Complete - Database Statistics")
        print("="*60)

        stats = importer.get_database_stats()
        for label, count in stats.items():
            print(f"  {label}: {count:,}")

        total_elapsed = time.time() - total_start
        print(f"\n⏱️  Total import time: {total_elapsed:.2f} seconds")
        print("\n✅ All done! Your Neo4j database is ready.")

    except Exception as e:
        print(f"\n❌ Error during import: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    finally:
        importer.close()


if __name__ == "__main__":
    main()