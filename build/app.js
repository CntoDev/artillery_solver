(function () {
'use strict';

const g = 9.80665;
const π = Math.PI;

const NATO_MRAD_IN_RAD = 1018.592;
const WP_MRAD_IN_RAD = 954.930;
const MRAD_IN_RAD = 1000;
const DEG_IN_RAD = 180 / π;

const QUADRANT_WIDTH = 100;

const SECTOR_RESOLUTION = 3;



const SECTOR_OFFSETS = [[], [0, 2], [1, 2], [2, 2], [0, 1], [1, 1], [2, 1], [0, 0], [1, 0], [2, 0]];

function calculateSolution(gunLocation, targetLocation, muzzleVelocity) {
  const elevationDifference = gunLocation.elevation - targetLocation.elevation;
  const { distance, bearing } = calculateDistanceAndBearing(gunLocation, targetLocation);
  const angle = calculateAngle(muzzleVelocity, distance, elevationDifference);
  const timeOnTarget = calculateTimeOnTarget(muzzleVelocity, angle, elevationDifference);

  return {
    distance,
    bearing,
    angle,
    timeOnTarget
  };
}

function calculateTimeOnTarget(muzzleVelocity, angle, elevationDifference) {
  const verticalVelocity = muzzleVelocity * Math.sin(angle);
  const sqrtValue = Math.sqrt(verticalVelocity * verticalVelocity - 2 * g * elevationDifference);

  return Math.max((verticalVelocity - sqrtValue) / g, (verticalVelocity + sqrtValue) / g);
}

function calculateAngle(muzzleVelocity, distance, elevationDifference) {
  const v2 = muzzleVelocity * muzzleVelocity;

  const sqrtValue = Math.sqrt(v2 * v2 - g * (g * distance * distance + 2 * elevationDifference * v2));
  const denominator = g * distance;

  return Math.max(Math.atan((v2 + sqrtValue) / denominator), Math.atan((v2 - sqrtValue) / denominator));
}

function calculateDistanceAndBearing(location1, location2) {
  const dLong = location2.long - location1.long;
  const dLat = location2.lat - location1.lat;
  return {
    distance: Math.sqrt(dLong * dLong + dLat * dLat),
    bearing: calculateBearing(dLong, dLat)
  };
}

function calculateBearing(dLong, dLat) {
  const rawBearing = Math.atan2(-dLat, dLong);
  const adjustedBearing = π / 2 - rawBearing;
  const bearing = adjustedBearing < 0 ? adjustedBearing + 2 * π : adjustedBearing;
  return bearing;
}

function quadrantSectorToCoordinates(quadrantId, sectors) {
  let coords = quadrantToCoordinates(quadrantId);

  let currentSectorWidth = QUADRANT_WIDTH;
  for (const sector of sectors) {
    currentSectorWidth /= SECTOR_RESOLUTION;
    const [longOffset, latOffset] = SECTOR_OFFSETS[sector];
    coords.long += longOffset * currentSectorWidth;
    coords.lat += latOffset * currentSectorWidth;
  }

  return {
    long: coords.long + currentSectorWidth / 2,
    lat: coords.lat + currentSectorWidth / 2
  };
}

function quadrantToCoordinates(quadrantId) {
  return {
    long: Number.parseInt(quadrantId.substr(0, 3)) * QUADRANT_WIDTH,
    lat: Number.parseInt(quadrantId.substr(3, 3)) * QUADRANT_WIDTH
  };
}

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

//======================================================================================================================

document.getElementById('startCountdown').addEventListener('click', startCountdown);

document.getElementById('gunElevation').addEventListener('keydown', recomputeSolution);
document.getElementById('gunElevation').addEventListener('change', recomputeSolution);
document.getElementById('gunElevation').addEventListener('click', function () {
  this.select();
});
document.getElementById('gunQuadrant').addEventListener('keydown', recomputeSolution);
document.getElementById('gunQuadrant').addEventListener('change', recomputeSolution);
document.getElementById('gunQuadrant').addEventListener('click', function () {
  this.select();
});

document.getElementById('targetElevation').addEventListener('keydown', recomputeSolution);
document.getElementById('targetElevation').addEventListener('change', recomputeSolution);
document.getElementById('targetElevation').addEventListener('click', function () {
  this.select();
});
document.getElementById('targetQuadrant').addEventListener('keydown', recomputeSolution);
document.getElementById('targetQuadrant').addEventListener('change', recomputeSolution);
document.getElementById('targetQuadrant').addEventListener('click', function () {
  this.select();
});

//======================================================================================================================

let interval = null;
let flashInterval = null;

const units = [{
  name: 'deg',
  convert: radians => Math.round(radians * DEG_IN_RAD * 100) / 100
}, {
  name: 'NATO mrad',
  convert: radians => Math.round(radians * NATO_MRAD_IN_RAD * 10) / 10
}, {
  name: 'WP mrad',
  convert: radians => Math.round(radians * WP_MRAD_IN_RAD * 10) / 10
}, {
  name: 'mrad',
  convert: radians => Math.round(radians * MRAD_IN_RAD * 10) / 10
}, {
  name: 'rad',
  convert: radians => Math.round(radians * 10000) / 10000
}];

const ranges = [{
  name: 'Short',
  index: 0
}, {
  name: 'Medium',
  index: 1
}, {
  name: 'Long',
  index: 2
}];

const weapons = [{
  name: 'M119A2',
  muzzleVelocity: [152.5, 240, 390],
  defaultUnit: units[0]
}, {
  name: 'M252',
  muzzleVelocity: [70, 140, 200],
  defaultUnit: units[1]
}];

//======================================================================================================================

const sectorDepth = 3;
const buttonOrder = [7, 8, 9, 4, 5, 6, 1, 2, 3];

const state = {
  weapon: weapons[0],
  range: ranges[0],
  unit: units[0],

  gun: {
    elevation: 0,
    quadrant: "000000",
    sector: [5, 5, 5]
  },
  target: {
    elevation: 0,
    quadrant: "010000",
    sector: [5, 5, 5]
  },

  gunQuadrant: "000000",
  gunSectors: [],
  targetQuadrant: "010000",
  targetSectors: []
};
window.state = state;

addWeaponPlatforms();
addRangeToggleButtons();
addUnitToggleButtons();
addSectorSplit(document.getElementById('gunSectors'), state.gunSectors, sectorDepth);
addSectorSplit(document.getElementById('targetSectors'), state.targetSectors, sectorDepth);
recomputeSolution();

//======================================================================================================================

function addSectorSplit(container, sectors, sectorDepth) {
  for (let level = 0; level < sectorDepth; ++level) {
    const group = document.createElement('div');
    group.classList.add('SectorGroup');
    container.appendChild(group);
    let row;
    buttonOrder.forEach(index => {
      if (index % 3 === 1) {
        row = document.createElement('div');
        group.appendChild(row);
      }

      const button = document.createElement('button');
      button.classList.add('Sector');
      const sector = {
        button,
        index
      };
      button.innerText = index;
      button.addEventListener('click', () => {
        selectSector(sectors, sector, level);
        recomputeSolution();
      });
      row.appendChild(button);
      if (index === 5) {
        sectors[level] = sector;
        sector.button.classList.add('isActive');
      }
    });
  }
}

function selectSector(sectors, sector, level) {
  sectors[level].button.classList.toggle('isActive');
  sectors[level] = sector;
  sectors[level].button.classList.toggle('isActive');
}

function selectUnit(unit) {
  state.unit.button.classList.toggle('isActive');
  state.unit = unit;
  state.unit.button.classList.toggle('isActive');
}

function selectRange(range) {
  state.range.button.classList.toggle('isActive');
  state.range = range;
  state.range.button.classList.toggle('isActive');
}

function addWeaponPlatforms() {
  const select = document.getElementById('weaponPlatform');
  weapons.forEach((weapon, index) => {
    const option = document.createElement('option');
    option.innerText = weapon.name;
    option.value = index;
    select.add(option);
  });

  select.addEventListener('change', () => {
    state.weapon = weapons[select.value];
    selectUnit(state.weapon.defaultUnit);
    recomputeSolution();
  });
}

function addRangeToggleButtons() {
  const container = document.getElementById('rangeToggle');

  ranges.forEach(range => {
    const { name, index } = range;
    const button = document.createElement('button');
    button.innerText = name;
    button.classList.add('UnitToggle');
    button.addEventListener('click', () => {
      selectRange(range);
      recomputeSolution();
    });
    range.button = button;
    container.appendChild(button);
  });

  state.range.button.classList.toggle('isActive');
}

function addUnitToggleButtons() {
  const container = document.getElementById('unitToggle');

  units.forEach(unit => {
    const { name, convert } = unit;
    const button = document.createElement('button');
    button.innerText = name;
    button.classList.add('UnitToggle');
    button.addEventListener('click', () => {
      selectUnit(unit);
      recomputeSolution();
    });
    unit.button = button;
    container.appendChild(button);
  });
  state.unit.button.classList.toggle('isActive');
}

function recomputeSolution() {
  const gunLocation = _extends({}, quadrantSectorToCoordinates(document.getElementById('gunQuadrant').value, state.gunSectors.map(x => x.index)), {
    elevation: document.getElementById('gunElevation').value
  });
  const targetLocation = _extends({}, quadrantSectorToCoordinates(document.getElementById('targetQuadrant').value, state.targetSectors.map(x => x.index)), {
    elevation: document.getElementById('targetElevation').value
  });
  const muzzleVelocity = state.weapon.muzzleVelocity[state.range.index];

  const { distance, bearing, angle, timeOnTarget } = calculateSolution(gunLocation, targetLocation, muzzleVelocity);

  document.getElementById('distance').value = Math.round(distance * 10) / 10;
  document.getElementById('bearing').value = state.unit.convert(bearing);
  document.getElementById('result').value = state.unit.convert(angle);
  document.getElementById('eta').value = Math.round(timeOnTarget * 10) / 10;
  [...document.getElementsByClassName('ResultUnit')].forEach(el => el.innerText = state.unit.name);

  interval && clearInterval(interval);
  flashInterval && clearInterval(flashInterval);
  document.getElementById('countdown').value = '';
}

function startCountdown() {
  let time = Number.parseFloat(document.getElementById('eta').value) * 10;
  interval && clearInterval(interval);
  flashInterval && clearInterval(flashInterval);

  document.getElementById('countdown').value = (time / 10).toFixed(1);

  interval = setInterval(() => {
    --time;
    document.getElementById('countdown').value = (time / 10).toFixed(1);
    if (time === 0 && interval) clearInterval(interval);
    if (time === 150) flash(document.getElementById('results'));
  }, 100);
}

function flash(element) {
  let flipCount = 10;
  flashInterval = setInterval(() => {
    --flipCount;
    element.style.backgroundColor = element.style.backgroundColor === 'red' ? 'white' : 'red';
    if (flipCount === 0 && flashInterval) clearInterval(flashInterval);
  }, 500);
}

}());
