# GridInsight Pro

Create a pixel-perfect enterprise GIS dashboard inspired by a professional utility digital twin platform.

Framework:

- React + TypeScript

- Tailwind CSS

- shadcn/ui

- Leaflet (or Mapbox GL JS)

- Lucide React icons

- Recharts

Overall Layout

--------------

Full-screen (1920×1080) dashboard with three sections:

1. Left navigation sidebar (80px)

2. Center interactive satellite map (~72% width)

3. Right analytics panel (380px)

Background:

#F7F8FA

Use Inter font.

Rounded corners: 12px

Soft shadows.

Professional utility software appearance.

--------------------------------

HEADER

White navigation bar.

Left:

Blue utility logo

Title:

GridGraph

Structural Digital Twin of Power Distribution Network

Blue divider

Hazard Overlay

Right:

Calendar icon

Last updated:

2025-05-20 10:35 AM

Refresh icon

Menu icon

--------------------------------

LEFT SIDEBAR

Dark navy (#0B2F6A)

Icons:

Home

Assets

Network

Hazards

Analytics

Reports

Settings

Overview selected.

Blue active indicator.

Bottom collapse button.

--------------------------------

MAIN MAP

Large satellite imagery.

Use Leaflet satellite layer.

Display:

Blue circular markers

Distribution poles

Green square markers

Transformers

Red triangle markers

Substations

Draw connecting power lines.

Green

High confidence

Yellow

Medium confidence

Red

Low confidence

Exactly like a power distribution topology.

No random lines.

Network should appear realistic.

--------------------------------

HAZARD OVERLAY

Flood zone:

Semi-transparent blue polygons following rivers.

Cyclone exposure:

Orange transparent polygons over coastal area.

Opacity 35%.

Satellite imagery visible underneath.

--------------------------------

MAP CONTROLS

Top left

Search asset textbox

Placeholder

Search location or asset

Filter icon

Left controls

Zoom +

Zoom –

Locate

Layers

Bottom left

Overview minimap

Bottom

Scale bar

0

0.5

1

1.5

2 km

Bottom right

Map attribution

Maxar

Mapbox

OpenStreetMap

--------------------------------

RIGHT PANEL

White card.

Heading

KEY PERFORMANCE INDICATORS

Six statistic cards.

Total Assets

1248

+3.2%

Poles

952

+2.7%

Transformers

178

+1.1%

Substations

3

0%

Inferred Edges

1356

+4.6%

High-Risk Assets

87

+5.4%

Each card:

Rounded

Shadow

Large bold numbers

Small colored icon

--------------------------------

LEGEND

Assets

Blue circle

Distribution Pole

Green square

Transformer

Red triangle

Substation

Inferred Power Lines

Green

High (≥0.7)

Yellow

Medium (0.4–0.7)

Red

Low (<0.4)

Hazard Overlay

Blue

Flood Zone (100-year)

Orange

Cyclone Exposure

Moderate

High

--------------------------------

BOTTOM TABLE

Inspection Priority

Columns

Priority

Assets

High-Risk Assets

% of Total

Action

Rows

High

212

63

24%

View

Medium

456

20

11%

View

Low

580

4

6.9%

View

Buttons outlined blue.

--------------------------------

INTERACTIONS

Hover on assets.

Click opens popup.

Search filters assets.

Hazard layer toggle.

Zoom.

Pan.

Responsive.

Professional animations.

--------------------------------

STYLE

The finished UI should look like enterprise GIS software used by electric utilities.

Minimal.

Clean.

Modern.

ArcGIS style.

Mapbox style.

Schneider Electric style.

Hitachi Energy style.

Publication quality suitable for an IEEE paper prototype.

Do NOT make it look like a generic admin dashboard.

Prioritize matching the visual composition of the provided reference image, including spacing, proportions, color palette, KPI cards, map controls, and analytics panel.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
