// Mapbox GL JS type declarations
declare module 'mapbox-gl' {
  const mapboxgl: any;
  export = mapboxgl;
}

declare module 'mapbox-gl/dist/mapbox-gl.css' {
  const content: any;
  export default content;
}

// Suppress the problematic mapbox point geometry types
declare module '@mapbox/point-geometry' {
  const Point: any;
  export = Point;
}