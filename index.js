'use strict';

document.getElementById('heightDifference').addEventListener('keydown', calculateAngle);
document.getElementById('heightDifference').addEventListener('change', calculateAngle);
document.getElementById('distance').addEventListener('keydown', calculateAngle);
document.getElementById('distance').addEventListener('change', calculateAngle);

const g = 9.80665;

const units = [
  {
    name: 'deg',
    convert: radians => radians / Math.PI * 180,
  },
  {
    name: 'NATO mrad',
    convert: radians => radians * 1018.592,
  },
  {
    name: 'WP mrad',
    convert: radians => radians * 954.930,
  },
/*{
    name: 'mrad',
    convert: radians => radians * 1000,
  },
  {
    name: 'rad',
    convert: radians => radians,
  },*/
];

const ranges = [
  {
    name: 'Short',
    index: 0
  },
  {
    name: 'Medium',
    index: 1
  },
  {
    name: 'Long',
    index: 2
  }
];

const weapons = [
  {
    name: 'M119A2',
    muzzleVelocity: [152.5, 240, 390],
    defaultUnit: units[0],
  },
  {
    name: 'M252',
    muzzleVelocity: [70, 140, 200],
    defaultUnit: units[1],
  },
];

//======================================================================================================================

const state = {
  weapon: weapons[0],
  range: ranges[0],
  unit: units[0],
}

addWeaponPlatforms();
addRangeToggleButtons();
addUnitToggleButtons();
calculateAngle();

//======================================================================================================================

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
    calculateAngle();
  });
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

function addRangeToggleButtons() {
  const container = document.getElementById('rangeToggle');

  ranges.forEach(range => {
    const { name, index } = range;
    const button = document.createElement('button');
    button.innerText = name;
    button.classList.add('UnitToggle');
    button.addEventListener('click', () => {
      selectRange(range);
      calculateAngle();
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
      calculateAngle();
    });
    unit.button = button;
    container.appendChild(button);
  });
  state.unit.button.classList.toggle('isActive');
}

function calculateAngle() {
  const v = state.weapon.muzzleVelocity[state.range.index];
  const x = Number.parseFloat(document.getElementById('distance').value);
  const y = Number.parseFloat(document.getElementById('heightDifference').value);

  const v2 = v * v;

  const result = ballisticFormula(v, x, y, g);

  document.getElementById('result').value = state.unit.convert(result[0]).toFixed(3);
  document.getElementById('altResult').value = state.unit.convert(result[1]).toFixed(3);
  document.getElementById('resultUnit').innerText = state.unit.name;
  document.getElementById('altResultUnit').innerText = state.unit.name;
}


function ballisticFormula(v, x, y, g = 9.81) {
  const v2 = v * v;

  const sqrtValue = Math.sqrt((v2 * v2) - g * ((g * x * x) + (2 * y * v2)));
  const denominator = g * x;

  return [
    Math.atan((v2 + sqrtValue) / denominator),
    Math.atan((v2 - sqrtValue) / denominator),
  ];
}
