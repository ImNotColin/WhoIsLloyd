import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useScrollAnimation } from '../../hooks/useScrollAnimation.js';
import { MAP_CENTER, MAP_ZOOM, COVERAGE_RADIUS_METERS, BUSINESS } from '../../content.js';

export default function CoverageMap() {
  const ref = useScrollAnimation();
  const mapEl = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current || !mapEl.current) return undefined;

    const map = L.map(mapEl.current, {
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      scrollWheelZoom: false,
      attributionControl: true,
    });
    mapRef.current = map;

    // CartoDB Dark Matter — free, no API key
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);

    // ~30 mile coverage radius in gold
    L.circle(MAP_CENTER, {
      radius: COVERAGE_RADIUS_METERS,
      color: '#C9A84C',
      weight: 1.5,
      fillColor: '#C9A84C',
      fillOpacity: 0.07,
    }).addTo(map);

    L.circleMarker(MAP_CENTER, {
      radius: 6,
      color: '#C9A84C',
      fillColor: '#C9A84C',
      fillOpacity: 1,
    })
      .addTo(map)
      .bindPopup('<b>Drones by Colin</b><br/>Bryan / College Station, TX');

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <section id="coverage" ref={ref} className="py-24 md:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <p data-reveal className="section-kicker mb-4">05 / COVERAGE</p>
        <h2 data-reveal className="heading-display text-5xl md:text-7xl mb-6">
          WHERE WE FLY
        </h2>
        <p data-reveal className="text-muted mb-10 max-w-xl">
          Home base is {BUSINESS.area}. The gold ring is the standard coverage
          zone — roughly a 30-mile radius. Outside the ring? Call. The drone travels.
        </p>
        <div
          data-reveal
          className="rounded-lg overflow-hidden border border-gold/40 shadow-[0_0_40px_rgba(201,168,76,0.08)]"
        >
          <div ref={mapEl} className="h-[420px] md:h-[520px] w-full" />
        </div>
      </div>
    </section>
  );
}
