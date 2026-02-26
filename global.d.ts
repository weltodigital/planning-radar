// Global type declarations

// Suppress problematic mapbox types
declare module 'mapbox__point-geometry' {
  const PointGeometry: any;
  export = PointGeometry;
}

declare module '@mapbox/point-geometry' {
  const Point: any;
  export = Point;
}

// Mapbox GL JS declarations
declare module 'mapbox-gl' {
  const mapboxgl: any;
  export = mapboxgl;
}

declare module 'mapbox-gl/dist/mapbox-gl.css'