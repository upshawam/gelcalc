// Constants
const NA_TABLE = 390; // mg sodium per gram table salt
const DEFAULT_FUELING = 1.0;   // g/kg/h (fallback, not used in new mode)

// Commercial gels
const PRODUCTS = [
  { name: "DIY Gel", carbs: 30, cost: 0.32 },
  { name: "Precision Gels", carbs: 30, cost: 2.88 },
  { name: "Maurten GEL 100", carbs: 40, cost: 4.50 }
];

// Volume factors (ml per gram dissolved)
const VOL_PER_G_CARBS = 0.62;
const VOL_PER_G_SALT  = 0.35;
const VOL_PER_G_CITRIC= 0.8;

// Dilution + sodium targets
const ML_PER_G_CARBS = 100 / 65; // 65 g carbs per 100 ml
const NA_PER_30G = 300;          // mg sodium per 30 g carbs

// Gut-training preset options (5g intervals)
const GUT_TRAINING_OPTIONS = [60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120];

function onModeChange() {
  const mode = document.getElementById('mode').value;
  document.getElementById('singleMode').style.display = mode === 'single' ? 'block' : 'none';
  document.getElementById('sharedMode').style.display = mode === 'shared' ? 'block' : 'none';
  document.getElementById('raceMode').style.display = mode === 'race' ? 'block' : 'none';
  calculate();
}

function setPresetA(carbs) {
  document.getElementById('carbsPerHourA').value = carbs;
  calculate();
}

function setPresetB(carbs) {
  document.getElementById('carbsPerHourB').value = carbs;
  calculate();
}

function buildCarbsPerHourOptions() {
  const selectIds = ['carbsPerHourSingle', 'carbsPerHourA', 'carbsPerHourB', 'carbsPerHourRace'];
  selectIds.forEach(id => {
    const select = document.getElementById(id);
    GUT_TRAINING_OPTIONS.forEach(carbs => {
      select.add(new Option(`${carbs} g/hr`, carbs));
    });
    // Set defaults based on athlete
    if (id === 'carbsPerHourB') {
      select.value = 75; // Kristin default
    } else {
      select.value = 85; // Aaron and single athlete default
    }
  });
}

function buildPaceOptions(selectId = 'pace') {
  const paceSelect = document.getElementById(selectId);
  for (let min = 6; min <= 15; min++) {
    for (let sec = 0; sec < 60; sec += 15) {
      const label = `${min}:${sec.toString().padStart(2,'0')}`;
      const opt = new Option(label, min + sec/60);
      paceSelect.add(opt);
    }
  }
  paceSelect.value = 8; // default ~8:00/mi
}

// Helper to parse HH:MM string into hours (e.g. "3:10" -> 3.1666...)
function parseTimeToHours(str) {
  if (!str || typeof str !== 'string') return null;
  const parts = str.split(':').map(s => s.trim());
  if (parts.length === 1) return parseFloat(parts[0]);
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) || 0;
  if (isNaN(h) || isNaN(m)) return null;
  return h + m/60;
}

function buildDistanceOptions(wholeId = 'milesWhole', decimalId = 'milesDecimal') {
  const whole = document.getElementById(wholeId);
  const decimal = document.getElementById(decimalId);
  
  // Clear existing options
  while (whole.options.length > 0) whole.remove(0);
  while (decimal.options.length > 0) decimal.remove(0);
  
  for (let i = 1; i <= 100; i++) whole.add(new Option(i, i));
  for (let d = 0; d <= 9; d++) decimal.add(new Option(d, d/10));
  whole.value = 10;
  decimal.value = 0;
}

function calculateSingleMode() {
  const milesWhole = +document.getElementById('milesWhole').value;
  const milesDecimal = +document.getElementById('milesDecimal').value;
  const miles = milesWhole + milesDecimal;
  const pace = parseFloat(document.getElementById('pace').value);
  const carbsPerHour = parseFloat(document.getElementById('carbsPerHourSingle').value);

  const durationH = (miles * pace) / 60;
  const totalCarbs = durationH * carbsPerHour;

  return renderRecipe(totalCarbs, null, null);
}

function calculateSharedMode() {
  const milesWholeA = +document.getElementById('milesWholeA').value;
  const milesDecimalA = +document.getElementById('milesDecimalA').value;
  const milesA = milesWholeA + milesDecimalA;
  const paceA = parseFloat(document.getElementById('paceA').value);
  const carbsPerHourA = parseFloat(document.getElementById('carbsPerHourA').value);

  const milesWholeB = +document.getElementById('milesWholeB').value;
  const milesDecimalB = +document.getElementById('milesDecimalB').value;
  const milesB = milesWholeB + milesDecimalB;
  const paceB = parseFloat(document.getElementById('paceB').value);
  const carbsPerHourB = parseFloat(document.getElementById('carbsPerHourB').value);

  const durationHA = (milesA * paceA) / 60;
  const durationHB = (milesB * paceB) / 60;

  const totalCarbsA = durationHA * carbsPerHourA;
  const totalCarbsB = durationHB * carbsPerHourB;
  const totalCarbsCombined = totalCarbsA + totalCarbsB;

  return renderRecipe(totalCarbsCombined, {carbs: totalCarbsA}, {carbs: totalCarbsB});
}

function renderRecipe(totalCarbs, athleteA, athleteB) {
  const malt = totalCarbs * (2/3);
  const fruc = totalCarbs * (1/3);
  const citric = totalCarbs * 0.004;

  // Sodium
  const naTargetTotal = (totalCarbs / 30) * NA_PER_30G;
  const tableG = naTargetTotal / NA_TABLE;

  // Water + volume
  const waterMl = Math.round(totalCarbs * ML_PER_G_CARBS);
  const totalVolumeMl = Math.round(
    waterMl +
    (totalCarbs * VOL_PER_G_CARBS) +
    (tableG * VOL_PER_G_SALT) +
    (citric * VOL_PER_G_CITRIC)
  );

  // Build recipe card
  let html = `
    <div class="recipe-section">
      <h2>Shared Batch Recipe</h2>
      <table class="recipe-table">
        <tr><th>Ingredient</th><th>Amount</th><th></th></tr>
        <tr>
          <td>Maltodextrin</td>
          <td>${malt.toFixed(0)} g</td>
          <td><a href="https://www.amazon.com/NOW-Nutrition-Maltodextrin-Absorption-Production/dp/B0013OUNRM" target="_blank" rel="noopener noreferrer" class="shop-link">🛒</a></td>
        </tr>
        <tr>
          <td>Fructose</td>
          <td>${fruc.toFixed(0)} g</td>
          <td><a href="https://www.iherb.com/pr/now-foods-fructose-sweetener-3-lbs-1-361-g/7762" target="_blank" rel="noopener noreferrer" class="shop-link">🛒</a></td>
        </tr>
        <tr>
          <td>Citric Acid</td>
          <td>${citric.toFixed(2)} g</td>
          <td><a href="https://www.amazon.com/Yerbero-Food-Grade-Versatile-Anhydrous-Preservative/dp/B0CWCCC8D3" target="_blank" rel="noopener noreferrer" class="shop-link">🛒</a></td>
        </tr>
        <tr><td>Table Salt</td><td>${tableG.toFixed(2)} g</td><td></td></tr>
        <tr><td>Water</td><td>${waterMl} ml</td><td></td></tr>
      </table>

      <!-- Why these ingredients link -->
      <p class="small" style="margin-top:8px; text-align:center;">
        <a href="ingredients.html" target="_blank" rel="noopener noreferrer">
          Why these ingredients?
        </a>
        <br />
        <a href="fueling-research.html" target="_blank" rel="noopener noreferrer">
          Fueling Protocol & Research
        </a>
      </p>
    </div>
    <div class="pills-container">
      <div class="pill">Total carbs: <strong>${Math.round(totalCarbs)}</strong> g</div>
      <div class="pill">Sodium total: <strong>${Math.round(naTargetTotal)}</strong> mg</div>
      <div class="pill">Final gel volume: <strong>${totalVolumeMl}</strong> ml</div>
    </div>
  `;

  // Per-athlete allocation if in shared mode
  if (athleteA && athleteB) {
    const carbsPerMl = totalCarbs / totalVolumeMl;
    const volumeA = athleteA.carbs / carbsPerMl;
    const volumeB = athleteB.carbs / carbsPerMl;

    html += `
      <h2>Per-Athlete Allocation</h2>
      <div class="allocation-grid">
        <div class="athlete-allocation">
          <h3>Aaron</h3>
          <div class="allocation-pill">
            <strong>${Math.round(athleteA.carbs)}</strong> g carbs
          </div>
          <div class="allocation-pill">
            <strong>${volumeA.toFixed(0)}</strong> ml
          </div>
        </div>
        <div class="athlete-allocation">
          <h3>Kristin</h3>
          <div class="allocation-pill">
            <strong>${Math.round(athleteB.carbs)}</strong> g carbs
          </div>
          <div class="allocation-pill">
            <strong>${volumeB.toFixed(0)}</strong> ml
          </div>
        </div>
      </div>
    `;
  }

  // Cost comparison
  html += `
    <h2>Cost comparison</h2>
    <div class="table-container">
      <table class="table">
        <tr><th>Product</th><th>Total activity cost</th></tr>
  `;

  PRODUCTS.forEach(p => {
    const gelsNeeded = Math.ceil(totalCarbs / p.carbs);
    const totalCost = gelsNeeded * p.cost;
    html += `<tr><td>${p.name}</td><td>$${totalCost.toFixed(2)}${p.name !== "DIY Gel" ? ` (for ${gelsNeeded} gels)` : ""}</td></tr>`;
  });

  html += `</table></div>`;
  document.getElementById('out').innerHTML = html;
}

function calculate() {
  const mode = document.getElementById('mode').value;
  if (mode === 'single') {
    calculateSingleMode();
  } else {
    if (mode === 'shared') calculateSharedMode();
    if (mode === 'race') calculateRaceMode();
  }
}

function calculateRaceMode() {
  const whole = +document.getElementById('raceDistanceWhole').value;
  const dec = +document.getElementById('raceDistanceDecimal').value;
  const distance = whole + dec;

  // Try planned finish time first
  const finishStr = document.getElementById('raceFinishTime').value.trim();
  let durationH = parseTimeToHours(finishStr);

  // If no finish time provided, try pace
  const paceInput = parseFloat(document.getElementById('paceRace').value);
  if (!durationH) {
    if (distance > 0 && paceInput) {
      durationH = (distance * paceInput) / 60;
    } else {
      // fallback: assume 3:10
      durationH = 3 + 10/60;
    }
  }

  const carbsPerHour = parseFloat(document.getElementById('carbsPerHourRace').value) || 100;
  const totalCarbs = durationH * carbsPerHour;

  // Recompute recipe numbers locally to show race-specific info
  const malt = totalCarbs * (2/3);
  const fruc = totalCarbs * (1/3);
  const citric = totalCarbs * 0.004;
  const naTargetTotal = (totalCarbs / 30) * NA_PER_30G;
  const tableG = naTargetTotal / NA_TABLE;
  const waterMl = Math.round(totalCarbs * ML_PER_G_CARBS);
  const totalVolumeMl = Math.round(
    waterMl +
    (totalCarbs * VOL_PER_G_CARBS) +
    (tableG * VOL_PER_G_SALT) +
    (citric * VOL_PER_G_CITRIC)
  );

  // Render the shared recipe view for race (reuse renderRecipe UI style)
  renderRecipe(totalCarbs, null, null);

  // Now append race-specific plan
  const aidText = document.getElementById('aidStations').value;
  const aidMiles = aidText.split(',').map(s => parseFloat(s)).filter(n => !isNaN(n)).sort((a,b)=>a-b);
  const paceMinPerMile = paceInput || ((durationH*60) / (distance || 26.2));

  // Dosing cadence: every 15 minutes (flexible)
  const cadenceMin = 15;
  const durationMin = Math.round(durationH * 60);
  let doses = [];
  for (let t = cadenceMin; t < durationMin; t += cadenceMin) {
    const doseCarbs = Math.round((carbsPerHour * (cadenceMin/60)));
    const mileAtDose = (t / paceMinPerMile);
    // find the next aid station at or after this mile
    let nextAid = aidMiles.find(m => m >= mileAtDose - 0.2);
    if (!nextAid) nextAid = aidMiles[aidMiles.length-1] || null;
    doses.push({ timeMin: t, carbs: doseCarbs, mile: mileAtDose, nextAid });
  }

  // Water estimates
  const waterInGel = waterMl; // ml
  const fluidTargetPerHour = 500; // ml/hr target baseline
  const totalFluidTarget = Math.round(durationH * fluidTargetPerHour);
  const additionalWaterNeeded = Math.max(0, totalFluidTarget - waterInGel);

  // Flask distribution
  const flaskCount = parseInt(document.getElementById('flaskCount').value, 10) || 2;
  const perFlaskMl = Math.ceil(totalVolumeMl / flaskCount);

  // Build HTML
  let html = `<div class="race-plan"><h2>Race Plan (Race mode)</h2>`;
  html += `<p><strong>Planned finish</strong>: ${finishStr || `${Math.floor(durationH)}:${Math.round((durationH%1)*60).toString().padStart(2,'0')}`} &nbsp; <strong>Distance</strong>: ${distance} mi &nbsp; <strong>Target</strong>: ${carbsPerHour} g/hr</p>`;

  html += `<h3>Fueling Schedule (every ${cadenceMin} min)</h3>`;
  html += `<table class="table"><tr><th>Time</th><th>Mile</th><th>Planned carbs</th><th>Nearest aid (mile)</th><th>Action</th></tr>`;
  let cumulative = 0;
  doses.forEach(d => {
    cumulative += d.carbs;
    const timeLabel = `${Math.floor(d.timeMin/60)}:${(d.timeMin%60).toString().padStart(2,'0')}`;
    const aidLabel = d.nextAid ? d.nextAid.toFixed(1) : 'none';
    const action = d.nextAid ? 'Take gel; chase at aid' : 'Take gel; carry water'
    html += `<tr><td>${timeLabel}</td><td>${d.mile.toFixed(1)}</td><td>${d.carbs} g</td><td>${aidLabel}</td><td>${action}</td></tr>`;
  });
  html += `</table>`;

  html += `<h3>Fluid Plan</h3>`;
  html += `<p>Water in gel mixture: <strong>${waterInGel} ml</strong><br/>Additional water target (approx): <strong>${additionalWaterNeeded} ml</strong> (≈ ${Math.round(additionalWaterNeeded / Math.max(1,doses.length))} ml per dose from aid stations)</p>`;

  html += `<h3>Flask distribution</h3>`;
  html += `<p>${flaskCount} flasks, ~${perFlaskMl} ml each (total gel volume ${totalVolumeMl} ml)</p>`;

  html += `</div>`;

  // Append to existing output
  const out = document.getElementById('out');
  out.innerHTML = out.innerHTML + html;
}

window.onload = () => {
  // Initialize single mode
  buildPaceOptions('pace');
  buildDistanceOptions('milesWhole', 'milesDecimal');
  buildCarbsPerHourOptions();
  
  // Initialize shared mode athletes
  buildPaceOptions('paceA');
  buildPaceOptions('paceB');
  buildDistanceOptions('milesWholeA', 'milesDecimalA');
  buildDistanceOptions('milesWholeB', 'milesDecimalB');
  // Initialize race mode controls
  buildPaceOptions('paceRace');
  buildDistanceOptions('raceDistanceWhole', 'raceDistanceDecimal');
  
  calculate();
};
