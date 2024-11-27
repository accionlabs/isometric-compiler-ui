# Point Utilities Documentation

This document describes a set of utility functions designed for managing and manipulating points in a 2D space, particularly useful for handling attachment points in diagram components.

## Overview

The utilities described here solve several geometric problems related to point manipulation:
- Finding the center point of a set of points
- Computing a concave hull around a set of points 
- Extracting segments from a hull based on directional constraints
- Creating grid-based point layouts
- Normalizing attachment points for components

## Function Descriptions

### 1. findCenterPoint

**Purpose:** Calculates the centroid (geometric center) of a set of points.

**Algorithm:**
1. If no points are provided, returns null
2. Sums up all x and y coordinates separately
3. Divides each sum by the total number of points
4. Returns a new point with the averaged coordinates

**Use Case:** This function is particularly useful when you need to find a central attachment point for a component or determine the middle point of a group of attachment points.

### 2. findConcaveHull

**Purpose:** Computes a concave hull (simplified outline) around a set of points using a modified gift wrapping algorithm.

**Algorithm:**
1. If fewer than 3 points are provided, returns the original points
2. Finds the leftmost point as the starting point
3. Iteratively builds the hull by:
   - Finding the next point with the most counterclockwise angle
   - Using cross product to determine the most counterclockwise point
   - Breaking ties by selecting the closest point
4. Continues until reaching the starting point

**Use Case:** This function is essential for creating a boundary around a set of attachment points, useful when determining the outline of a component or finding attachment regions.

### 3. getHullSegment

**Purpose:** Extracts a segment of points from a hull between two specified directions (N, S, E, W).

**Algorithm:**
1. Handles special cases (hull too small)
2. Determines if the specified directions are in clockwise order
3. Finds extreme points in the specified directions using custom comparators
4. Extracts points between the extreme points, handling wrap-around cases
5. Returns the segment maintaining the correct order

**Use Case:** Used when you need to find attachment points along a specific edge or side of a component, particularly useful for connecting components in specific orientations.

### 4. createGridPoints

**Purpose:** Creates a grid-like arrangement of points based on directional constraints.

**Algorithm:**
1. Processes points row by row
2. For each row:
   - Computes the concave hull of remaining points
   - Extracts a segment based on specified directions
   - Names points using a letter-number grid system (a1, a2, b1, b2, etc.)
   - Removes processed points
3. Continues until all points are processed or maximum rows (z) is reached

**Use Case:** This function is valuable when you need to create organized, grid-like attachment points for complex components, ensuring systematic naming and arrangement.

### 5. getNormalizedAttachmentPoints

**Purpose:** Normalizes attachment points for components by finding representative points for different attachment regions.

**Algorithm:**
1. Defines standard attachment regions (front-left, front-right, back-left, back-right)
2. For each region:
   - Computes the concave hull of points in that region
   - Extracts the relevant segment based on predefined directions
   - Finds the center point of the segment
3. Handles top and bottom points separately using simple center point calculation

**Use Case:** This function standardizes attachment points across different components, making it easier to connect components consistently regardless of their internal complexity.

## Direction Mapping

The functions use a consistent direction system:
- N (North): Minimum Y coordinate
- S (South): Maximum Y coordinate
- E (East): Maximum X coordinate
- W (West): Minimum X coordinate

This directional system is crucial for consistent point selection and segment extraction across all functions.

## Error Handling

The functions include several safety measures:
- Handling of empty or insufficient point sets
- Prevention of infinite loops in grid creation
- Fallback to original points when calculations cannot be performed
- Proper handling of edge cases in hull segment extraction

## Performance Considerations

While these functions are optimized for typical use cases, they may have performance implications for large point sets:
- `findConcaveHull`: O(n²) complexity
- `getHullSegment`: O(n) complexity
- `findCenterPoint`: O(n) complexity
- `createGridPoints`: O(n²) complexity due to repeated hull calculations

For most diagram-related uses, these performance characteristics are acceptable as the number of points is typically small.