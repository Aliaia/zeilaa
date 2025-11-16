# QPM Data Import to Neo4j

Production-ready scripts for importing Quantitative Place Model (QPM) ontology data into Neo4j.

## Features

✅ **Scalable** - Handles millions of nodes with batch processing
✅ **Robust** - Full error handling and transaction management
✅ **Fast** - Optimized queries and indexes for large datasets
✅ **Clean** - Pure QPM ontology implementation
✅ **Flexible** - Import individual hierarchies or all at once

---

## Prerequisites

### 1. Neo4j Database

- **Neo4j 4.4+** or **Neo4j 5.x** recommended
- **APOC plugin** (optional but recommended for better performance)
- Minimum **4GB heap size** for large imports
- Recommended **8GB heap size** for optimal performance

### 2. Python Environment

- **Python 3.8+**
- Virtual environment recommended

---

## Installation

### Step 1: Install Dependencies

```bash
cd import_qpm_to_neo4j

# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install requirements
pip install -r requirements.txt
Step 2: Configure Neo4j Connection
# Copy the example environment file
cp .env.example .env

# Edit .env with your Neo4j credentials
nano .env  # or use your preferred editor
Edit .env file:

NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password_here
BATCH_SIZE=1000
CLEAR_DB_BEFORE_IMPORT=false
Step 3: Verify Neo4j is Running
# Test connection (optional)
python neo4j_importer.py
Usage
Import All Hierarchies
python import_all_hierarchies.py --hierarchy all
Import Specific Hierarchy
# Import only Admin hierarchy
python import_all_hierarchies.py --hierarchy admin

# Import only Electoral hierarchy
python import_all_hierarchies.py --hierarchy electoral

# Import only Postal hierarchy
python import_all_hierarchies.py --hierarchy postal
Clear Database Before Import
⚠️ WARNING: This will delete all existing data!

python import_all_hierarchies.py --hierarchy all --clear-db

Custom File Paths
Edit the .env file to specify custom paths:

ADMIN_HIERARCHY_FILE=../Hierarchy_Full_with_names_and_places/Admin_Hierarchy.ttl
ADMIN_PLACES_FILE=../Hierarchy_Full_with_names_and_places/Admin_Full_places52.ttl
ELECTORAL_HIERARCHY_FILE=../Hierarchy_Full_with_names_and_places/Electoral Hierarchy.ttl
POSTAL_HIERARCHY_FILE=../Hierarchy_Full_with_names_and_places/Postal_hierarchy.ttl

Import Process
The import follows this optimized sequence:

Schema Setup - Create constraints and indexes
Hierarchies - Import hierarchy definitions
Units - Batch import spatial units
Places - Batch import semantic places
Geometries - Import point and polygon geometries
Relationships - Create all relationships in batches
Inverse Relationships - Create inverse relationships for query performance

Performance Tuning
For Large Datasets (1M+ nodes)
Increase Neo4j memory:

Edit neo4j.conf:

# Heap size (50% of available RAM)
dbms.memory.heap.initial_size=4g
dbms.memory.heap.max_size=8g

# Page cache (25% of available RAM)
dbms.memory.pagecache.size=4g

# Transaction state
dbms.memory.transaction.global_max_size=2g
Adjust batch size in .env:

BATCH_SIZE=5000  # Larger batches for faster import (if you have RAM)

Disable query logging during import:

dbms.logs.query.enabled=false
Expected Import Times
| Dataset Size | Estimated Time | Notes | |-------------|----------------|-------| | 100K nodes | 2-5 minutes | Current Wales dataset | | 1M nodes | 15-30 minutes | Regional dataset | | 10M nodes | 2-4 hours | National dataset |

Validation
Check Import Success
// In Neo4j Browser or cypher-shell

// Count nodes by type
MATCH (u:Unit) RETURN count(u) as Units;
MATCH (p:Place) RETURN count(p) as Places;
MATCH (g:Geometry) RETURN count(g) as Geometries;
MATCH (h:Hierarchy) RETURN count(h) as Hierarchies;

// Count relationships
MATCH ()-[r]->() RETURN type(r) as RelType, count(r) as Count;

// Sample data
MATCH (p:Place)-[:HAS_MAIN_GEOMETRY]->(g:Geometry)
RETURN p.place_name, g.latitude, g.longitude
LIMIT 10;
Verify Indexes
CALL db.indexes()
YIELD name, type, entityType, labelsOrTypes, properties
RETURN name, type, labelsOrTypes, properties;
Verify Constraints
CALL db.constraints();
Troubleshooting
Error: "Cannot connect to Neo4j"
Solution:

Verify Neo4j is running: systemctl status neo4j or check Docker
Check connection string in .env
Verify credentials
Error: "Out of memory" during import
Solution:

Increase Neo4j heap size in neo4j.conf
Reduce BATCH_SIZE in .env (try 500 or 250)
Import hierarchies one at a time
Error: "APOC procedure not found"
Solution: The scripts will fall back to non-APOC methods automatically. For better performance:

Install APOC plugin for Neo4j
Restart Neo4j
Slow import performance
Solution:

Disable query logging: dbms.logs.query.enabled=false
Increase batch size if you have RAM: BATCH_SIZE=5000
Use SSD storage for Neo4j data directory
Import hierarchies separately instead of all at once
File Structure
import_qpm_to_neo4j/
├── README.md                    # This file
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment configuration template
├── wkt_parser.py                # WKT geometry parser
├── ttl_parser.py                # TTL/RDF parser
├── neo4j_importer.py            # Neo4j batch importer
└── import_all_hierarchies.py   # Main orchestration script
Testing Individual Components
Test WKT Parser
python wkt_parser.py
Test TTL Parser
python ttl_parser.py ../Hierarchy_Full_with_names_and_places/Admin_Hierarchy.ttl
Test Neo4j Connection
python neo4j_importer.py
Advanced Usage
Import Custom Datasets
Create a custom import script:

from ttl_parser import parse_ttl_file
from neo4j_importer import Neo4jImporter

# Parse your custom TTL file
data = parse_ttl_file('path/to/your/file.ttl')

# Import into Neo4j
with Neo4jImporter('bolt://localhost:7687', 'neo4j', 'password') as importer:
    importer.create_constraints_and_indexes()
    importer.import_units(data['units'], hierarchy_type='Custom')
    importer.import_places(data['places'])
    importer.import_geometries(data['geometries'])
    importer.import_relationships(data['relationships'])
Query Examples
See NEO4J_QPM_SCHEMA.md for comprehensive query examples.

Support & Issues
Documentation:

Schema Design: ../NEO4J_QPM_SCHEMA.md
Application Changes: ../APPLICATION_MIGRATION_GUIDE.md
Common Issues:

Check Neo4j logs: /var/log/neo4j/ or Docker logs
Verify data file paths are correct
Ensure Python version is 3.8+
License
Part of the QPM research project.

