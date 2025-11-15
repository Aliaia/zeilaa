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