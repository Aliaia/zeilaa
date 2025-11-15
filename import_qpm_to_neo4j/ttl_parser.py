"""
TTL (Turtle/RDF) Parser for QPM Ontology Data
Parses Turtle RDF files and extracts entities and relationships
"""

from rdflib import Graph, Namespace, RDF, RDFS, Literal
from typing import Dict, List, Any, Optional, Tuple
from tqdm import tqdm
import re
from wkt_parser import parse_wkt_point, parse_wkt_polygon, get_geometry_type, calculate_centroid


# Define namespaces
QPM = Namespace("http://qpm.ontology/2025#")
GEO = Namespace("http://www.opengis.net/ont/geosparql#")
XSD = Namespace("http://www.w3.org/2001/XMLSchema#")


class QPMParser:
    """Parser for QPM ontology TTL files"""

    def __init__(self):
        self.graph = Graph()
        self.hierarchies = []
        self.units = []
        self.places = []
        self.geometries = []
        self.relationships = []

    def parse_file(self, file_path: str, show_progress: bool = True):
        """
        Parse a TTL file and load into RDF graph.

        Args:
            file_path: Path to the TTL file
            show_progress: Show progress bar
        """
        print(f"📖 Parsing {file_path}...")

        if show_progress:
            # For large files, parse with progress indication
            self.graph.parse(file_path, format='turtle')
        else:
            self.graph.parse(file_path, format='turtle')

        print(f"✅ Parsed {len(self.graph)} triples")

    def extract_hierarchies(self) -> List[Dict[str, Any]]:
        """Extract all Hierarchy nodes from the graph."""
        print("🗂️  Extracting Hierarchies...")

        hierarchies = []
        query = """
            SELECT ?h ?id ?name ?levels ?units_num
            WHERE {
                ?h a qpm:Hierarchy .
                OPTIONAL { ?h qpm:hierarchy_id ?id }
                OPTIONAL { ?h qpm:hierarchy_name ?name }
                OPTIONAL { ?h qpm:hierarchy_levels ?levels }
                OPTIONAL { ?h qpm:units_number ?units_num }
            }
        """

        results = self.graph.query(query, initNs={'qpm': QPM})

        for row in results:
            hierarchy = {
                'uri': str(row.h),
                'hierarchy_id': int(row.id) if row.id else None,
                'hierarchy_name': str(row.name) if row.name else None,
                'hierarchy_levels': int(row.levels) if row.levels else None,
                'units_number': int(row.units_num) if row.units_num else None
            }
            hierarchies.append(hierarchy)

        self.hierarchies = hierarchies
        print(f"✅ Found {len(hierarchies)} hierarchies")
        return hierarchies

    def extract_units(self) -> List[Dict[str, Any]]:
        """Extract all Unit nodes from the graph."""
        print("🏢 Extracting Units...")

        units = []

        # Query for all units
        for unit_uri in tqdm(self.graph.subjects(RDF.type, QPM.Unit), desc="Processing units"):
            unit = {
                'uri': str(unit_uri),
                'spatial_unit_id': self._extract_unit_id(unit_uri),
            }

            # Extract properties
            for prop_name in ['unit_name', 'unit_type', 'unit_level', 'unit_h3']:
                prop_uri = QPM[prop_name]
                value = self.graph.value(unit_uri, prop_uri)
                if value:
                    if prop_name == 'unit_level':
                        unit[prop_name] = int(value)
                    else:
                        unit[prop_name] = str(value)

            units.append(unit)

        self.units = units
        print(f"✅ Found {len(units)} units")
        return units

    def extract_places(self) -> List[Dict[str, Any]]:
        """Extract all Place nodes from the graph."""
        print("📍 Extracting Places...")

        places = []

        for place_uri in tqdm(self.graph.subjects(RDF.type, QPM.Place), desc="Processing places"):
            place = {
                'uri': str(place_uri),
                'place_id': self._extract_place_id(place_uri),
            }

            # Extract properties
            property_mapping = {
                'place_name': str,
                'place_type': str,
                'place_function': str,
                'place_key': str,
                'place_level': int,
                'place_h3': str,
                'place_s2': str,
                'model_source': str,
                'geometry_source': str
            }

            for prop_name, prop_type in property_mapping.items():
                prop_uri = QPM[prop_name]
                value = self.graph.value(place_uri, prop_uri)
                if value:
                    try:
                        place[prop_name] = prop_type(value)
                    except (ValueError, TypeError):
                        place[prop_name] = str(value)

            places.append(place)

        self.places = places
        print(f"✅ Found {len(places)} places")
        return places

    def extract_geometries(self) -> List[Dict[str, Any]]:
        """Extract all Geometry nodes from the graph."""
        print("🗺️  Extracting Geometries...")

        geometries = []

        for geom_uri in tqdm(self.graph.subjects(RDF.type, QPM.Geometry), desc="Processing geometries"):
            geom = {
                'uri': str(geom_uri),
                'geometry_id': str(geom_uri).split('/')[-1],  # Extract ID from URI
            }

            # Extract geometry role
            role = self.graph.value(geom_uri, QPM.geometry_role)
            geom['geometry_role'] = str(role) if role else 'main'

            # Extract WKT
            wkt = self.graph.value(geom_uri, GEO.asWKT)
            if wkt:
                geom['wkt'] = str(wkt)
                geom['geometry_type'] = get_geometry_type(str(wkt))

                # Parse coordinates based on type
                if geom['geometry_type'] == 'POINT':
                    coords = parse_wkt_point(str(wkt))
                    if coords:
                        geom['longitude'] = coords[0]
                        geom['latitude'] = coords[1]

                elif geom['geometry_type'] == 'POLYGON':
                    coords = parse_wkt_polygon(str(wkt))
                    if coords:
                        # Calculate centroid for polygon
                        centroid = calculate_centroid(coords)
                        if centroid:
                            geom['longitude'] = centroid[0]
                            geom['latitude'] = centroid[1]

            geometries.append(geom)

        self.geometries = geometries
        print(f"✅ Found {len(geometries)} geometries")
        return geometries

    def extract_relationships(self) -> List[Dict[str, Any]]:
        """Extract all relationships from the graph."""
        print("🔗 Extracting Relationships...")

        relationships = []

        # Define relationship types to extract
        relationship_types = [
            ('contained_by', 'CONTAINED_BY'),
            ('belongs_to_hierarchy', 'BELONGS_TO_HIERARCHY'),
            ('contained_by_unit', 'CONTAINED_BY_UNIT'),
            ('base_place_parent', 'BASE_PLACE_PARENT'),
            ('north_of', 'NORTH_OF'),
            ('south_of', 'SOUTH_OF'),
            ('east_of', 'EAST_OF'),
            ('west_of', 'WEST_OF'),
            ('hasMainGeometry', 'HAS_MAIN_GEOMETRY'),
            ('hasExtraGeometry', 'HAS_EXTRA_GEOMETRY'),
        ]

        for qpm_rel, neo4j_rel in tqdm(relationship_types, desc="Relationship types"):
            qpm_uri = QPM[qpm_rel]

            for subject, obj in self.graph.subject_objects(qpm_uri):
                rel = {
                    'from_uri': str(subject),
                    'to_uri': str(obj),
                    'type': neo4j_rel,
                    'from_id': self._extract_id(str(subject)),
                    'to_id': self._extract_id(str(obj))
                }
                relationships.append(rel)

        self.relationships = relationships
        print(f"✅ Found {len(relationships)} relationships")
        return relationships

    def _extract_unit_id(self, uri) -> Optional[int]:
        """Extract unit ID from URI like qpm:unit_123"""
        match = re.search(r'unit_(\d+)', str(uri))
        return int(match.group(1)) if match else None

    def _extract_place_id(self, uri) -> Optional[int]:
        """Extract place ID from URI like qpm:place_456"""
        match = re.search(r'place_(\d+)', str(uri))
        return int(match.group(1)) if match else None

    def _extract_hierarchy_id(self, uri) -> Optional[int]:
        """Extract hierarchy ID from URI like qpm:hierarchy_1"""
        match = re.search(r'hierarchy_(\d+)', str(uri))
        return int(match.group(1)) if match else None

    def _extract_id(self, uri: str) -> Optional[Any]:
        """Extract ID from any URI"""
        # Try different patterns
        for pattern in [r'unit_(\d+)', r'place_(\d+)', r'hierarchy_(\d+)', r'place_(\d+)_.*_geom']:
            match = re.search(pattern, uri)
            if match:
                try:
                    return int(match.group(1))
                except ValueError:
                    return match.group(1)
        return None

    def get_all_data(self) -> Dict[str, List]:
        """Get all extracted data in one call."""
        return {
            'hierarchies': self.hierarchies if self.hierarchies else self.extract_hierarchies(),
            'units': self.units if self.units else self.extract_units(),
            'places': self.places if self.places else self.extract_places(),
            'geometries': self.geometries if self.geometries else self.extract_geometries(),
            'relationships': self.relationships if self.relationships else self.extract_relationships()
        }


def parse_ttl_file(file_path: str) -> Dict[str, List]:
    """
    Convenience function to parse a TTL file and extract all data.

    Args:
        file_path: Path to TTL file

    Returns:
        Dictionary with hierarchies, units, places, geometries, and relationships
    """
    parser = QPMParser()
    parser.parse_file(file_path)
    return parser.get_all_data()


if __name__ == "__main__":
    # Test with a sample file
    import sys

    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        print(f"Testing parser with {file_path}")

        data = parse_ttl_file(file_path)

        print("\n📊 Summary:")
        print(f"  Hierarchies: {len(data['hierarchies'])}")
        print(f"  Units: {len(data['units'])}")
        print(f"  Places: {len(data['places'])}")
        print(f"  Geometries: {len(data['geometries'])}")
        print(f"  Relationships: {len(data['relationships'])}")

        # Show samples
        if data['hierarchies']:
            print("\n🗂️  Sample Hierarchy:", data['hierarchies'][0])
        if data['units']:
            print("\n🏢 Sample Unit:", data['units'][0])
        if data['places']:
            print("\n📍 Sample Place:", data['places'][0])
        if data['geometries']:
            print("\n🗺️  Sample Geometry:", data['geometries'][0])
    else:
        print("Usage: python ttl_parser.py <path_to_ttl_file>")