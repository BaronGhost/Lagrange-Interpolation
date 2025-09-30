// script.js
// Lagrange interpolation logic translated from the uploaded C program and adapted for JS UI.
// (Uses robust checks: duplicate x, out-of-range warning, direct hit when x equals a data point.)

document.addEventListener('DOMContentLoaded', () => {
  const numPointsInput = document.getElementById('numPoints');
  const generateBtn = document.getElementById('generateBtn');
  const pointsGrid = document.getElementById('pointsGrid');
  const calculateBtn = document.getElementById('calculateBtn');
  const queryXInput = document.getElementById('queryX');
  const resultBox = document.getElementById('resultBox');
  const resultText = document.getElementById('resultText');
  const warningsEl = document.getElementById('warnings');
  const clearBtn = document.getElementById('clearBtn');
  const sortBtn = document.getElementById('sortBtn');

  // Create a point row (x and y inputs)
  function createPointRow(idx, defaultX = '', defaultY = '') {
    const wrapper = document.createElement('div');
    wrapper.className = 'point-row';
    const lx = document.createElement('div');
    lx.className = 'label';
    lx.textContent = idx + 1;
    const xin = document.createElement('input');
    xin.type = 'number';
    xin.step = 'any';
    xin.placeholder = 'x';
    xin.value = defaultX;
    xin.dataset.role = 'x';
    const yin = document.createElement('input');
    yin.type = 'number';
    yin.step = 'any';
    yin.placeholder = 'y';
    yin.value = defaultY;
    yin.dataset.role = 'y';

    wrapper.appendChild(lx);
    wrapper.appendChild(xin);
    wrapper.appendChild(yin);
    return wrapper;
  }

  // Generate points grid
  function generatePointsGrid(n) {
    pointsGrid.innerHTML = '';
    // Use some helpful defaults when n == 3: a parabola example
    const defaults = {
      1: [[0, 0]],
      2: [[0, 0], [1, 1]],
      3: [[0, 0], [1, 1], [2, 4]]
    };
    for (let i = 0; i < n; i++) {
      const def = (defaults[n] && defaults[n][i]) ? defaults[n][i] : ['', ''];
      const row = createPointRow(i, def[0], def[1]);
      pointsGrid.appendChild(row);
    }
  }

  // Read points from UI
  function readPoints() {
    const rows = Array.from(pointsGrid.querySelectorAll('.point-row'));
    const pts = [];
    for (const r of rows) {
      const xEl = r.querySelector('input[data-role="x"]');
      const yEl = r.querySelector('input[data-role="y"]');
      const x = parseFloat(xEl.value);
      const y = parseFloat(yEl.value);
      if (Number.isNaN(x) || Number.isNaN(y)) {
        throw new Error('Please fill all x and y fields with numeric values.');
      }
      pts.push({ x, y, el: r });
    }
    return pts;
  }

  // Sort point rows visually (and keep inputs in that order)
  function sortPointsByX() {
    try {
      const pts = readPoints();
      pts.sort((a, b) => a.x - b.x);
      // Rebuild grid
      pointsGrid.innerHTML = '';
      pts.forEach((p, idx) => {
        const row = createPointRow(idx, p.x, p.y);
        pointsGrid.appendChild(row);
      });
    } catch (e) {
      showWarning(e.message);
    }
  }

  // Lagrange interpolation function
  function lagrange(points, x) {
    // points: array of {x, y}
    const n = points.length;
    let sum = 0;
    for (let j = 0; j < n; j++) {
      let num = 1;
      let den = 1;
      for (let k = 0; k < n; k++) {
        if (k === j) continue;
        num *= (x - points[k].x);
        den *= (points[j].x - points[k].x);
      }
      if (den === 0) {
        // duplicate x values -> invalid
        throw new Error('Duplicate x-values detected (division by zero). Ensure all x are distinct.');
      }
      sum += (num / den) * points[j].y;
    }
    return sum;
  }

  // UI helpers
  function showResult(text) {
    resultText.textContent = text;
    resultBox.classList.remove('show');
    // force reflow to restart animation
    void resultBox.offsetWidth;
    resultBox.classList.add('show');
  }
  function showWarning(msg) {
    warningsEl.textContent = msg;
    warningsEl.style.display = 'block';
  }
  function clearWarnings() {
    warningsEl.textContent = '';
  }

  // Calculate handler
  function calculateHandler() {
    clearWarnings();
    try {
      const pts = readPoints();
      // detect duplicate x's
      const xs = pts.map(p => p.x);
      const seen = new Set();
      for (const v of xs) {
        if (seen.has(v)) throw new Error('Duplicate x-values found. Each x must be unique.');
        seen.add(v);
      }

      // Sort numeric by x (makes range check meaningful)
      pts.sort((a, b) => a.x - b.x);

      const rawX = queryXInput.value;
      if (rawX === '') throw new Error('Please enter the x value to evaluate.');
      const xVal = parseFloat(rawX);
      if (Number.isNaN(xVal)) throw new Error('x must be a number.');

      // If x matches an existing data point exactly -> return that y directly (numerically robust)
      for (const p of pts) {
        if (Math.abs(p.x - xVal) === 0) { // exact equality for numeric input
          showResult(`y = ${formatNumber(p.y)} (exact data point)`);
          return;
        }
      }

      // Range warning (interpolation vs extrapolation)
      const minX = pts[0].x, maxX = pts[pts.length - 1].x;
      if (xVal < minX || xVal > maxX) {
        showWarning('Warning: x is outside the interpolation range (extrapolation may be inaccurate).');
      }

      // compute
      const y = lagrange(pts, xVal);
      showResult(`y = ${formatNumber(y)}`);
    } catch (err) {
      showWarning(err.message || String(err));
    }
  }

  function formatNumber(v) {
    // show up to 8 significant digits but keep readable
    if (!isFinite(v)) return String(v);
    // reduce noisy floats
    return parseFloat(v.toPrecision(8)).toString();
  }

  // Clear handler
  function clearHandler() {
    const inputs = pointsGrid.querySelectorAll('input');
    inputs.forEach(inp => inp.value = '');
    queryXInput.value = '';
    clearWarnings();
    showResult('Result will appear here.');
  }

  // Event wiring
  generateBtn.addEventListener('click', () => {
    let n = parseInt(numPointsInput.value, 10);
    if (Number.isNaN(n) || n < 1 || n > 10) {
      showWarning('Number of points must be between 1 and 10.');
      return;
    }
    generatePointsGrid(n);
    clearWarnings();
  });

  calculateBtn.addEventListener('click', calculateHandler);
  clearBtn.addEventListener('click', clearHandler);
  sortBtn.addEventListener('click', sortPointsByX);

  // initial generation
  generatePointsGrid(parseInt(numPointsInput.value, 10) || 3);
});
