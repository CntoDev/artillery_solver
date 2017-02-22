'use strict';

document.getElementById('muzzle_velocity').addEventListener('change', calculateAngle);
document.getElementById('height_difference').addEventListener('keydown', calculateAngle);
document.getElementById('distance').addEventListener('keydown', calculateAngle);

const g = 9.80665;

const units = [
  {
    name: "deg",
    convert: radians => radians / Math.PI * 180,
  },
  {
    name: "NATO mrad",
    convert: radians => radians * 1018.592,
  },
  {
    name: "WP mrad",
    convert: radians => radians * 954.930,
  },
  {
    name: "mrad",
    convert: radians => radians * 1000,
  },
  {
    name: "rad",
    convert: radians => radians,
  },
];

let activeUnit = units[0];

addUnitToggleButtons();
calculateAngle();

//======================================================================================================================

function addUnitToggleButtons() {
  const container = document.getElementById('unitToggle');

  units.forEach((unit, index) => {
    const { name, convert } = unit;
    const button = document.createElement('button');
    button.innerText = name;
    button.classList.add('UnitToggle');
    button.addEventListener('click', () => {
      activeUnit.button.classList.toggle('isActive');
      activeUnit = units[index];
      activeUnit.button.classList.toggle('isActive');
      calculateAngle();
    });
    unit.button = button;
    container.appendChild(button);
  });
}

function calculateAngle() {
  const v = Number.parseFloat(document.getElementById('muzzle_velocity').value);
  const x = Number.parseFloat(document.getElementById('distance').value);
  const y = Number.parseFloat(document.getElementById('height_difference').value);

  const v2 = v * v;

  const result = ballisticFormula(v, x, y, g);

  document.getElementById('result').value = activeUnit.convert(result[0]).toFixed(3);
  document.getElementById('altResult').value = activeUnit.convert(result[1]).toFixed(3);
  document.getElementById('resultUnit').innerText = activeUnit.name;
  document.getElementById('altResultUnit').innerText = activeUnit.name;
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
