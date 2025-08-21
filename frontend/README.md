# 🚀 Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

---

## 📜 Available Scripts

In the project directory, you can run:

### ▶️ `npm start`

Runs the app in **development mode**.  
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

- The page will reload when you make changes.
- You may also see lint errors in the console.

---

## 🗄️ Connecting to Neo4j Database

In the `src/secrets/` folder, update the **Neo4j credentials** inside the `secrets.json` file.

The file includes the following fields:

- `URI`
- `username`
- `password`

---

## 📂 Project Structure

### 🔧 Components

- **CollapsibleTable** → Table used for listing nodes and edges.
- **DetailedPanel** → Displays node information when clicked in the ReactLeaf map.
- **SearchInputForm** → Contains all search-related functionality.

### 📄 Pages

- **DeckGLPage** → Contains the DeckGL map component.
- **MapTabs** → Provides tab options for switching between multiple maps.
- **ReactLeaf** → Contains the ReactLeaf map component.

### ⚙️ Services

- **neo4jService** → Handles the connection to Neo4j and executes Cypher queries, returning the results.

---

✅ With this structure, you can easily locate components, pages, and services for extending the project.
