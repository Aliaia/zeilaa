"""
WKT (Well-Known Text) Parser for Geometry Extraction
Extracts coordinates from WKT POINT and POLYGON strings
"""

import re
from typing import Tuple, List, Optional


def parse_wkt_point(wkt_string: str) -> Optional[Tuple[float, float]]:
    """
    Parse a WKT POINT string and extract longitude, latitude.

    Args:
        wkt_string: WKT string like "POINT (-3.1703282 51.4648449)"

    Returns:
        Tuple of (longitude, latitude) or None if parsing fails

    Example:
        >>> parse_wkt_point("POINT (-3.1703282 51.4648449)")
        (-3.1703282, 51.4648449)
    """
    try:
        # Match POINT (lon lat) pattern
        pattern = r'POINT\s*\(\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*\)'
        match = re.search(pattern, wkt_string, re.IGNORECASE)

        if match:
            lon = float(match.group(1))
            lat = float(match.group(2))
            return (lon, lat)
        return None
    except (ValueError, AttributeError) as e:
        print(f"Error parsing WKT POINT: {wkt_string} - {e}")
        return None


def parse_wkt_polygon(wkt_string: str) -> Optional[List[Tuple[float, float]]]:
    """
    Parse a WKT POLYGON string and extract list of coordinates.

    Args:
        wkt_string: WKT string like "POLYGON ((lon1 lat1, lon2 lat2, ...))"

    Returns:
        List of (longitude, latitude) tuples or None if parsing fails

    Example:
        >>> parse_wkt_polygon("POLYGON ((-3.17 51.46, -3.17 51.46, -3.17 51.46))")
        [(-3.17, 51.46), (-3.17, 51.46), (-3.17, 51.46)]
    """
    try:
        # Match POLYGON ((lon lat, lon lat, ...)) pattern
        pattern = r'POLYGON\s*\(\s*\((.*?)\)\s*\)'
        match = re.search(pattern, wkt_string, re.IGNORECASE)

        if match:
            coords_string = match.group(1)
            # Split by comma to get individual coordinate pairs
            coord_pairs = coords_string.split(',')
            coordinates = []

            for pair in coord_pairs:
                parts = pair.strip().split()
                if len(parts) == 2:
                    lon = float(parts[0])
                    lat = float(parts[1])
                    coordinates.append((lon, lat))

            return coordinates if coordinates else None
        return None
    except (ValueError, AttributeError) as e:
        print(f"Error parsing WKT POLYGON: {wkt_string[:100]}... - {e}")
        return None


def parse_wkt_multipolygon(wkt_string: str) -> Optional[List[List[Tuple[float, float]]]]:
    """
    Parse a WKT MULTIPOLYGON string and extract list of polygon coordinates.

    Args:
        wkt_string: WKT string like "MULTIPOLYGON (((lon lat, ...)), ((lon lat, ...)))"

    Returns:
        List of polygons, where each polygon is a list of (lon, lat) tuples
    """
    try:
        # Match all polygon parts within MULTIPOLYGON
        pattern = r'\(\((.*?)\)\)'
        matches = re.findall(pattern, wkt_string, re.IGNORECASE)

        polygons = []
        for match in matches:
            coord_pairs = match.split(',')
            coordinates = []

            for pair in coord_pairs:
                parts = pair.strip().split()
                if len(parts) == 2:
                    lon = float(parts[0])
                    lat = float(parts[1])
                    coordinates.append((lon, lat))

            if coordinates:
                polygons.append(coordinates)

        return polygons if polygons else None
    except (ValueError, AttributeError) as e:
        print(f"Error parsing WKT MULTIPOLYGON: {wkt_string[:100]}... - {e}")
        return None


def get_geometry_type(wkt_string: str) -> str:
    """
    Determine the geometry type from a WKT string.

    Args:
        wkt_string: WKT string

    Returns:
        One of: 'POINT', 'POLYGON', 'MULTIPOLYGON', 'UNKNOWN'
    """
    wkt_upper = wkt_string.upper().strip()

    if wkt_upper.startswith('POINT'):
        return 'POINT'
    elif wkt_upper.startswith('MULTIPOLYGON'):
        return 'MULTIPOLYGON'
    elif wkt_upper.startswith('POLYGON'):
        return 'POLYGON'
    else:
        return 'UNKNOWN'


def calculate_centroid(coordinates: List[Tuple[float, float]]) -> Optional[Tuple[float, float]]:
    """
    Calculate the centroid of a polygon given its coordinates.

    Args:
        coordinates: List of (longitude, latitude) tuples

    Returns:
        Tuple of (centroid_lon, centroid_lat) or None if calculation fails
    """
    try:
        if not coordinates or len(coordinates) < 3:
            return None

        # Simple average (works for most cases, though not geometrically precise for complex polygons)
        sum_lon = sum(coord[0] for coord in coordinates)
        sum_lat = sum(coord[1] for coord in coordinates)

        centroid_lon = sum_lon / len(coordinates)
        centroid_lat = sum_lat / len(coordinates)

        return (centroid_lon, centroid_lat)
    except (ValueError, ZeroDivisionError) as e:
        print(f"Error calculating centroid: {e}")
        return None


if __name__ == "__main__":
    # Test cases
    print("Testing WKT Parser...")

    # Test POINT parsing
    point_wkt = "POINT (-3.1703282089999334 51.464844931000073)"
    result = parse_wkt_point(point_wkt)
    print(f"POINT: {result}")
    assert result == (-3.1703282089999334, 51.464844931000073)

    # Test POLYGON parsing
    polygon_wkt = "POLYGON ((-3.171039803327804 51.46551482599339, -3.1711470555446666 51.46489519423769, -3.170624559104274 51.46445822445667))"
    result = parse_wkt_polygon(polygon_wkt)
    print(f"POLYGON: {len(result)} coordinates" if result else "POLYGON: None")
    assert result is not None and len(result) == 3

    # Test geometry type detection
    assert get_geometry_type(point_wkt) == 'POINT'
    assert get_geometry_type(polygon_wkt) == 'POLYGON'

    # Test centroid calculation
    coords = [(-3.17, 51.46), (-3.17, 51.47), (-3.16, 51.47), (-3.16, 51.46)]
    centroid = calculate_centroid(coords)
    print(f"Centroid: {centroid}")

    print("✅ All WKT parser tests passed!")