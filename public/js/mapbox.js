/* eslint-disable */
import mapboxgl from 'mapbox-gl';

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiZXJpY2tiYWRpbGxhOTkiLCJhIjoiY2t6eXBva2c1MDJuNTNkcWhidG1zbmtrYSJ9.UjBFd8ryFWEo-3nxHbSzuw';
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/erickbadilla99/ckzz1ombq000015s5gmwldocm',
    center: [-118.46212453351873, 34.019940638313265],
    zoom: 4,
    interactive: true,
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((location) => {
    //Create a marker
    const element = document.createElement('div');
    element.className = 'marker';

    //Add Marker
    new mapboxgl.Marker({
      element,
      anchor: 'bottom',
    })
      .setLngLat(location.coordinates)
      .addTo(map);

    // Add Popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(location.coordinates)
      .setHTML(`<p>Day ${location.day}: ${location.description}</p>`)
      .addTo(map);

    //Extends de map bounds to include location
    bounds.extend(location.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
