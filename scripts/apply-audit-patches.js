#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PATCH_FIELDS = [
  'svStatus',
  'svConfidence',
  'svPanoId',
  'svHeading',
  'svPitch',
  'svRadius',
  'svLat',
  'svLng',
  'svNotes'
];

function slugifyStationPart(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildStationId(station) {
  return [
    slugifyStationPart(station.system),
    slugifyStationPart(station.city),
    slugifyStationPart(station.name)
  ].join('__');
}

function parseJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to parse JSON from ${filePath}: ${error.message}`);
  }
}

function normalizePatch(patch) {
  if (!patch || typeof patch !== 'object') return null;
  const normalized = {};
  for (const field of PATCH_FIELDS) {
    if (patch[field] !== undefined) normalized[field] = patch[field];
  }
  if (patch.id) normalized.id = patch.id;
  if (patch.name) normalized.name = patch.name;
  return normalized;
}

function parseStationObject(line) {
  const match = line.match(/^(\s*)({.*})(,?\s*)$/);
  if (!match) return null;
  const [, indent, objectLiteral, suffix] = match;
  try {
    const station = Function(`"use strict"; return (${objectLiteral});`)();
    return { indent, objectLiteral, suffix, station };
  } catch {
    return null;
  }
}

function formatValue(value) {
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return JSON.stringify(value);
}

function formatStationObject(station) {
  const orderedKeys = [];
  const seen = new Set();
  const preferredOrder = [
    'name',
    'system',
    'city',
    'lat',
    'lng',
    'heading',
    'svPanoId',
    'svLat',
    'svLng',
    'svHeading',
    'svPitch',
    'svRadius',
    'svConfidence',
    'svStatus',
    'svNotes',
    'id'
  ];

  for (const key of preferredOrder) {
    if (station[key] !== undefined) {
      orderedKeys.push(key);
      seen.add(key);
    }
  }

  for (const key of Object.keys(station)) {
    if (!seen.has(key) && station[key] !== undefined) {
      orderedKeys.push(key);
      seen.add(key);
    }
  }

  return `{ ${orderedKeys.map((key) => `${key}: ${formatValue(station[key])}`).join(', ')} }`;
}

function applyPatches(stationsFilePath, patches) {
  const original = fs.readFileSync(stationsFilePath, 'utf8');
  const lines = original.split('\n');
  const normalizedPatches = patches.map(normalizePatch).filter(Boolean);
  const patchesById = new Map();
  const patchesByName = new Map();

  for (const patch of normalizedPatches) {
    if (patch.id) patchesById.set(patch.id, patch);
    if (patch.name) patchesByName.set(patch.name, patch);
  }

  let applied = 0;
  const unmatched = new Set(normalizedPatches.map((patch) => patch.id || patch.name));

  const nextLines = lines.map((line) => {
    const parsed = parseStationObject(line);
    if (!parsed) return line;

    const station = { ...parsed.station };
    const stationId = station.id || buildStationId(station);
    const patch = patchesById.get(stationId) || patchesByName.get(station.name);
    if (!patch) return line;

    unmatched.delete(patch.id || patch.name);

    for (const field of PATCH_FIELDS) {
      if (patch[field] === undefined) continue;
      if (patch[field] === null || patch[field] === '') delete station[field];
      else station[field] = patch[field];
    }

    applied += 1;
    return `${parsed.indent}${formatStationObject(station)},${parsed.suffix.trimEnd()}`;
  });

  fs.writeFileSync(stationsFilePath, nextLines.join('\n'));
  return { applied, unmatched: [...unmatched] };
}

function main() {
  const patchFileArg = process.argv[2];
  if (!patchFileArg) {
    console.error('Usage: node scripts/apply-audit-patches.js <patches.json>');
    process.exit(1);
  }

  const projectRoot = path.resolve(__dirname, '..');
  const stationsFilePath = path.join(projectRoot, 'stations.js');
  const patchFilePath = path.resolve(process.cwd(), patchFileArg);
  const patches = parseJsonFile(patchFilePath);
  if (!Array.isArray(patches)) {
    console.error('Patch file must contain a JSON array.');
    process.exit(1);
  }

  const { applied, unmatched } = applyPatches(stationsFilePath, patches);
  console.log(`Applied ${applied} patch${applied === 1 ? '' : 'es'} to ${path.relative(process.cwd(), stationsFilePath)}.`);
  if (unmatched.length > 0) {
    console.log(`Unmatched patches: ${unmatched.join(', ')}`);
  }
}

main();
