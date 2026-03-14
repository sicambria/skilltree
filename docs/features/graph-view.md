# Advanced Graph View

The Skill Tree platform now features a high-performance, interactive graph visualization to navigate the systemic connections between skills and career paths (trees).

## Features

### 1. Interactive Force-Directed Layout
- **Visual Nodes**: Represent both "Trees" (Navigation Hubs) and "Atomic Skills".
- **Dynamic Connections**: Visualize parent-child relationships between skills and the membership of skills within specific trees.
- **Physics-Based Interactivity**: Drag nodes to reorganize the view, or zoom and pan to explore dense clusters.

### 2. Intelligent Filtering
- **Type Filtering**: Toggle the visibility of Trees or Skills to simplify the view.
- **Search-to-Highlight**: Filter nodes by name in real-time. Matching nodes remain visible/highlighted while others fade into the background.
- **Relationship Highlighting**: Hovering over a node highlights its immediate neighbors (parents, children, or associated trees), dimming unrelated parts of the graph.

### 3. Systematic Insight
- **Cross-Tree Connections**: Identify skills that are shared across multiple disciplines (e.g., "Critical Thinking" appearing in both Engineering and People trees).
- **Scale Visualization**: Tree nodes are rendered larger to denote their role as organizational hubs, while atomic skills form the granular network.

## Accessing the Graph
Navigate to **"Graph View"** in the main user navbar (top menu).

## Implementation Details
- **Frontend**: D3.js (v7) for physics and rendering.
- **Backend**: Dedicated `/api/graph/data` endpoint serving structured node-link data.
