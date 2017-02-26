import { NATO_MRAD_IN_RAD, WP_MRAD_IN_RAD, MRAD_IN_RAD, DEG_IN_RAD, SECTOR_PRECISION, SECTOR_ORDER } from './constants.js';
import { calculateSolution, quadrantSectorToCoordinates } from './math.js';

//======================================================================================================================

document.getElementById('closeHelp').addEventListener('click', toggleView);
document.getElementById('openHelp').addEventListener('click', toggleView);

document.getElementById('startCountdown').addEventListener('click', startCountdown);
document.getElementById('stopCountdown').addEventListener('click', stopCountdown);

document.getElementById('gunElevation').addEventListener('keydown', recomputeSolution);
document.getElementById('gunElevation').addEventListener('change', recomputeSolution);
document.getElementById('gunElevation').addEventListener('click', function () { this.select(); });
document.getElementById('gunQuadrant').addEventListener('keydown', recomputeSolution);
document.getElementById('gunQuadrant').addEventListener('change', recomputeSolution);
document.getElementById('gunQuadrant').addEventListener('click', function () { this.select(); });

document.getElementById('targetElevation').addEventListener('keydown', recomputeSolution);
document.getElementById('targetElevation').addEventListener('change', recomputeSolution);
document.getElementById('targetElevation').addEventListener('click', function () { this.select(); });
document.getElementById('targetQuadrant').addEventListener('keydown', recomputeSolution);
document.getElementById('targetQuadrant').addEventListener('change', recomputeSolution);
document.getElementById('targetQuadrant').addEventListener('click', function () { this.select(); });

//======================================================================================================================

let interval = null;
let flashInterval = null;

const units = [
  {
    name: 'deg',
    convert: radians => Math.round(radians * DEG_IN_RAD * 100) / 100,
  },
  {
    name: 'NATO mrad',
    convert: radians => Math.round(radians * NATO_MRAD_IN_RAD * 10) / 10,
  },
  {
    name: 'WP mrad',
    convert: radians => Math.round(radians * WP_MRAD_IN_RAD * 10) / 10,
  },
  {
    name: 'mrad',
    convert: radians => Math.round(radians * MRAD_IN_RAD * 10) / 10,
  },
  {
    name: 'rad',
    convert: radians => Math.round(radians * 10000) / 10000,
  },
];

const weapons = [
  {
    name: 'M119A2',
    muzzleVelocity: [152.5, 240, 390],
    defaultUnit: units[0],
  },
  {
    name: 'Mk6',
    muzzleVelocity: [70, 140, 200],
    defaultUnit: units[1],
  },
];

//======================================================================================================================

const views = [
  document.getElementById('calculatorView'),
  document.getElementById('helpView'),
];

const state = {
  view: views[0],
  weapon: weapons[0],
  range: 0,
  unit: weapons[0].defaultUnit,

  gun: {
    elevation: 0,
    quadrant: "000000",
    sector: [5, 5, 5],
  },

  target: {
    elevation: 0,
    quadrant: "010000",
    sector: [5, 5, 5],
  },

  gunQuadrant: "000000",
  gunSectors: [],
  targetQuadrant: "010000",
  targetSectors: [],
};
window.state = state;

state.view.classList.toggle('isActive');

addWeaponPlatforms();
addRanges();
addUnitToggleButtons();
addSectorSplit(document.getElementById('gunSectors'), state.gunSectors, SECTOR_PRECISION);
addSectorSplit(document.getElementById('targetSectors'), state.targetSectors, SECTOR_PRECISION);
recomputeSolution();

//======================================================================================================================

function toggleView() {
  state.view.classList.toggle('isActive');
  state.view = state.view === views[0] ? views[1] : views[0];
  state.view.classList.toggle('isActive');
}

function addSectorSplit(container, sectors, SECTOR_PRECISION) {
  for (let level = 0; level < SECTOR_PRECISION; ++level) {
    const group = document.createElement('div');
    group.classList.add('SectorGroup');
    container.appendChild(group);
    let row;
    SECTOR_ORDER.forEach(index => {
      if (index % 3 === 1) {
        row = document.createElement('div');
        group.appendChild(row);
      }

      const button = document.createElement('button');
      button.classList.add('Sector');
      const sector = {
        button,
        index,
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

function addRanges() {
  const select = document.getElementById('rangeSelect');
  select.innerHtml = '';

  state.weapon.muzzleVelocity.forEach((range, index) => {
    const option = document.createElement('option');
    option.innerText = index + 1;
    option.value = index;
    select.add(option);
  });

  select.addEventListener('change', () => {
    state.range = select.value;
    recomputeSolution();
  });
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
  const gunLocation = {
    ...quadrantSectorToCoordinates(document.getElementById('gunQuadrant').value, state.gunSectors.map(x => x.index)),
    elevation: document.getElementById('gunElevation').value,
  };
  const targetLocation = {
    ...quadrantSectorToCoordinates(document.getElementById('targetQuadrant').value, state.targetSectors.map(x => x.index)),
    elevation: document.getElementById('targetElevation').value,
  };
  const muzzleVelocity = state.weapon.muzzleVelocity[state.range];

  const { distance, bearing, angle, timeOnTarget } = calculateSolution(gunLocation, targetLocation, muzzleVelocity);

  document.getElementById('distance').value = Math.round(distance * 10) / 10;
  document.getElementById('bearing').value = state.unit.convert(bearing);
  document.getElementById('result').value = state.unit.convert(angle);
  document.getElementById('eta').value = Math.round(timeOnTarget * 10) / 10;
  [...document.getElementsByClassName('ResultUnit')].forEach(el => el.innerText = state.unit.name);

  stopCountdown();
}

function startCountdown() {
  stopCountdown();

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

function stopCountdown() {
  interval && clearInterval(interval);
  flashInterval && clearInterval(flashInterval);
  document.getElementById('countdown').value = '';
}

function flash(element) {
  let flipCount = 10;
  flashInterval = setInterval(() => {
    --flipCount;
    element.style.backgroundColor = element.style.backgroundColor === 'red' ? 'white' : 'red';
    if (flipCount === 0 && flashInterval) clearInterval(flashInterval);
  }, 500);
}
