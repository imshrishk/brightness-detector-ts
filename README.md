# Video Brightness Detector

A TypeScript-based web application that analyzes video files to detect the brightest point across all frames. The application processes videos in real-time using the HTML5 Canvas API and provides visual feedback of the analysis results.

## Features

- Real-time video frame analysis
- Drag-and-drop interface for video uploads
- Brightness detection using RGB weighted algorithm
- Visual representation of the brightest point
- Analysis metrics including:
  - Maximum brightness value
  - Average brightness in surrounding area
  - Precise coordinates of brightest point
 
## Technical Details

The brightness detection algorithm uses the following weighted RGB formula to calculate perceived brightness:
```
brightness = (0.299 * Red) + (0.587 * Green) + (0.114 * Blue)
```

This formula accounts for human perception of different colors, where green appears brighter than red, and red appears brighter than blue.

## Getting Started

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/imshrishk/brightness-detector-ts.git
cd brightness-detector-ts
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

5. Serve the production build:
```bash
npm start
```

## How It Works

1. Video Processing:
   - Videos are processed frame by frame using requestAnimationFrame
   - Each frame is drawn to a canvas for pixel analysis
   - The RGB values of each pixel are weighted to calculate brightness

2. Brightness Detection:
   - Tracks the brightest pixel found across all frames
   - Calculates average brightness in a 10-pixel radius around the brightest point

3. Results Display:
   - Shows the frame containing the brightest point
   - Marks the exact location with a crosshair