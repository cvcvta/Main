// Converts us-atlas (pre-projected Albers USA, 975×610) into assets/us-states.json: [{id, name, d}].
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { feature, mesh } from 'topojson-client';
const require = createRequire(import.meta.url);
const topo = require('us-atlas/states-albers-10m.json');
const ring = r => 'M' + r.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L') + 'Z';
const path = g => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).map(p => p.map(ring).join('')).join('');
const states = feature(topo, topo.objects.states).features.map(f => ({ id: f.id, name: f.properties.name, d: path(f.geometry) }));
const borders = mesh(topo, topo.objects.states, (a, b) => a !== b).coordinates.map(l => 'M' + l.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L')).join('');
fs.writeFileSync('assets/us-states.json', JSON.stringify({ viewBox: [0, 0, 975, 610], states, borders }));
console.log(states.length, 'states,', (fs.statSync('assets/us-states.json').size / 1024).toFixed(0), 'KB');
