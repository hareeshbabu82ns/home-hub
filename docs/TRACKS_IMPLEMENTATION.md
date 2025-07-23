# Tracks Feature Implementation

## Overview

The Tracks feature provides comprehensive CRUD operations for tracking items with typed attributes, advanced filtering, search capabilities, and data visualization through charts and graphs.

## Features Implemented

### 1. Enhanced Data Models

- **TrackItem**: Basic tracking entity with title and description
- **TrackAttributes**: Flexible attributes with multiple value types:
  - `STRING`: Text values
  - `INT`: Integer values
  - `FLOAT`: Decimal values
  - `DATETIME`: Date and time values

### 2. CRUD Operations

- **Create**: New tracks and attributes with proper form validation
- **Read**: Fetch tracks and attributes with filtering and sorting
- **Update**: Edit existing tracks and attributes
- **Delete**: Remove tracks and attributes with proper cascading

### 3. Advanced Filtering & Search

- Filter by track title and description
- Filter by date ranges (created from/to)
- Filter attributes by:
  - Attribute name/title
  - Value type (STRING, INT, FLOAT, DATETIME)
  - Numeric value ranges (min/max)
  - Text search across attribute values
- Real-time filtering with debounced search

### 4. Data Visualization & Analytics

- **Metrics Dashboard**:
  - Total items and attributes count
  - Recent activity (7-day window)
  - Attribute type distribution
- **Line Charts**: Trend visualization for numeric attributes over time
- **Bar Charts**: Daily activity and frequency charts
- **Pie Charts**: Attribute type distribution visualization
- **Customizable Time Periods**: Week, Month, Year views

### 5. User Interface Components

#### Core Pages

- `/tracks` - Main tracks listing with metrics overview
- `/tracks/new` - Create new track form
- `/tracks/analytics` - Dedicated analytics dashboard
- `/tracks/[id]` - Individual track detail with attributes and charts

#### Reusable Components

- `TrackFilter` - Advanced filtering interface
- `TrackingCharts` - Comprehensive charts using Recharts
- `TrackAttributesDataGrid` - Sortable, filterable data table
- `TrackAttributeForm` - Dynamic form supporting all value types
- `TracksPageClient` - Client-side state management wrapper

### 6. Technical Implementation

#### Backend Actions (`actions.ts`)

```typescript
// Track Items
- fetchTrackItems(filters?: TrackItemFilter)
- fetchTrackItem(id: string)
- createTrackItem(formData)
- updateTrackItem(formData)
- deleteTrackItem(formData)

// Track Attributes
- fetchTrackItemAttributes(trackId: string)
- fetchTrackAttributesWithFilters(trackId, filters)
- createTrackItemAttribute(formData)
- updateTrackItemAttribute(formData)
- deleteTrackItemAttribute(formData)

// Analytics
- getTrackingMetrics(): Promise<TrackingMetrics>
- getAttributeChartData(trackId, attributeTitle, period)
- getTrackItemActivityData(trackId, period)
```

#### Type Definitions (`types/track.ts`)

```typescript
- TrackItemWithAttributes
- TrackAttributeFormData
- TrackAttributeFilter
- TrackItemFilter
- ChartDataPoint
- TrackingMetrics
```

### 7. Key Features

#### Dynamic Value Type Handling

The system automatically handles different data types:

- String values stored in `value` field
- Integer values stored in `valueInt` field
- Float values stored in `valueFloat` field
- DateTime values stored in `valueDate` field

#### Smart Form Validation

- Client-side validation with real-time feedback
- Server-side validation using Zod schemas
- Type-specific input components (number, datetime-local, text)

#### Advanced Sorting & Filtering

- Multi-field sorting (name, type, value, date)
- Ascending/descending toggle
- Real-time filtering without page refreshes
- Combined text and numeric range filters

#### Responsive Charts

- Mobile-friendly responsive design
- Interactive tooltips and legends
- Customizable time periods
- Multiple chart types for different data insights

### 8. Usage Examples

#### Creating a Weight Tracking Item

1. Navigate to `/tracks/new`
2. Enter title: "Weight Tracking"
3. Add description: "Daily weight measurements"
4. Save track
5. Add attributes:
   - Title: "Weight", Type: FLOAT, Value: 75.5
   - Title: "Date", Type: DATETIME, Value: current date

#### Viewing Analytics

1. Go to specific track detail page
2. Charts automatically show:
   - Weight trend over time (line chart)
   - Daily measurement frequency (bar chart)
3. Filter by week/month/year periods
4. Select different numeric attributes for visualization

### 9. Future Enhancements

- Export data to CSV/JSON
- Import data from external sources
- Goal setting and progress tracking
- Notification reminders
- Data sharing capabilities
- Mobile app integration
- Advanced statistical analysis
- Machine learning predictions

## File Structure

```
src/app/(app)/tracks/
├── page.tsx                           # Main tracks listing
├── new/page.tsx                       # Create new track
├── analytics/page.tsx                 # Analytics dashboard
├── [id]/page.tsx                      # Track detail view
├── actions.ts                         # Server actions (CRUD + analytics)
└── components/
    ├── track-filter.tsx               # Advanced filtering UI
    ├── tracking-charts.tsx            # Charts and graphs
    ├── track-attributes-data-grid-new.tsx # Enhanced data grid
    ├── track-attr-form.tsx            # Attribute form with type support
    ├── track-detail-page.tsx          # Track detail client component
    └── tracks-page-client.tsx         # Main page client wrapper

src/types/
└── track.ts                          # TypeScript definitions
```

This implementation provides a robust, scalable tracking system with modern UI/UX patterns, comprehensive data visualization, and flexible attribute management suitable for any type of personal or business tracking needs.
