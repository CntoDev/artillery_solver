import { g, π, NATO_MRAD_IN_RAD, WP_MRAD_IN_RAD, MRAD_IN_RAD, DEG_IN_RAD,
    QUADRANT_WIDTH, SECTOR_PRECISION, SECTOR_RESOLUTION, SECTOR_OFFSETS } from './constants.js';

export function calculateSolution(gunLocation, targetLocation, muzzleVelocity) {
  const elevationDifference = gunLocation.elevation - targetLocation.elevation;
  const { distance, bearing } = calculateDistanceAndBearing(gunLocation, targetLocation);
  const angle = calculateAngle(muzzleVelocity, distance, elevationDifference);
  const timeOnTarget = calculateTimeOnTarget(muzzleVelocity, angle, elevationDifference);

  return {
    distance,
    bearing,
    angle,
    timeOnTarget,
  };
}

function calculateTimeOnTarget(muzzleVelocity, angle, elevationDifference) {
  const verticalVelocity = (muzzleVelocity * Math.sin(angle));
  const sqrtValue = Math.sqrt((verticalVelocity * verticalVelocity) - (2 * g * elevationDifference));

  return Math.max((verticalVelocity - sqrtValue) / g, (verticalVelocity + sqrtValue) / g);
}

function calculateAngle(muzzleVelocity, distance, elevationDifference) {
  const v2 = muzzleVelocity * muzzleVelocity;

  const sqrtValue = Math.sqrt((v2 * v2) - g * ((g * distance * distance) + (2 * elevationDifference * v2)));
  const denominator = g * distance;

  return Math.max(Math.atan((v2 + sqrtValue) / denominator), Math.atan((v2 - sqrtValue) / denominator));
}

function calculateDistanceAndBearing(location1, location2) {
  const dLong = location2.long - location1.long;
  const dLat = location2.lat - location1.lat;
  return {
    distance: Math.sqrt((dLong * dLong) + (dLat * dLat)),
    bearing: calculateBearing(dLong, dLat),
  };
}

function calculateBearing(dLong, dLat) {
  const rawBearing = Math.atan2(-dLat, dLong);
  const adjustedBearing = (π / 2 - rawBearing);
  const bearing = adjustedBearing < 0 ? adjustedBearing + (2 * π) : adjustedBearing;
  return bearing;
}

export function quadrantSectorToCoordinates(quadrantId, sectors) {
  let coords = quadrantToCoordinates(quadrantId);

  let currentSectorWidth = QUADRANT_WIDTH;
  for (const sector of sectors) {
    currentSectorWidth /= SECTOR_RESOLUTION;
    const [longOffset, latOffset] = SECTOR_OFFSETS[sector];
    coords.long += longOffset * currentSectorWidth;
    coords.lat += latOffset * currentSectorWidth;
  }

  return {
    long: coords.long + (currentSectorWidth / 2),
    lat: coords.lat + (currentSectorWidth / 2),
  };
}

function quadrantToCoordinates(quadrantId) {
  return {
    long: Number.parseInt(quadrantId.substr(0, 3)) * QUADRANT_WIDTH,
    lat: Number.parseInt(quadrantId.substr(3, 3)) * QUADRANT_WIDTH,
  };
}
