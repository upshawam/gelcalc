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
  document.getElementById('bulkMode').style.display = mode === 'bulk' ? 'block' : 'none';
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
  const selectIds = ['carbsPerHourSingle', 'carbsPerHourA', 'carbsPerHourB'];
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

function getRecipeValues(totalCarbs) {
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
  const dryMixG = malt + fruc + citric + tableG;

  return {
    malt,
    fruc,
    citric,
    naTargetTotal,
    tableG,
    waterMl,
    totalVolumeMl,
    dryMixG,
  };
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
  const { malt, fruc, citric, naTargetTotal, tableG, waterMl, totalVolumeMl, dryMixG } = getRecipeValues(totalCarbs);

  // Build recipe card
  let html = `
    <div class="recipe-section">
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
        <tr style="border-top: 2px solid #ddd; font-weight: 600;"><td>Pre-mixed Dry Ingredients</td><td>${Math.round(dryMixG)} g</td><td></td></tr>
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
          <h3>Athlete A</h3>
          <div class="allocation-pill">
            <strong>${Math.round(athleteA.carbs)}</strong> g carbs
          </div>
          <div class="allocation-pill">
            <strong>${volumeA.toFixed(0)}</strong> ml
          </div>
        </div>
        <div class="athlete-allocation">
          <h3>Athlete B</h3>
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
  } else if (mode === 'shared') {
    calculateSharedMode();
  } else if (mode === 'bulk') {
    calculateBulkMode();
  }
}

function calculateBulkMode() {
  const bulkBasis = document.getElementById('bulkBasis').value;
  const bulkAmount = parseFloat(document.getElementById('bulkAmount').value) || 0;

  let totalCarbs = 0;

  if (bulkBasis === 'malt') {
    totalCarbs = bulkAmount * 1.5;
  } else if (bulkBasis === 'fruc') {
    totalCarbs = bulkAmount * 3;
  } else if (bulkBasis === 'carbs') {
    totalCarbs = bulkAmount;
  } else if (bulkBasis === 'dry') {
    totalCarbs = bulkAmount / (1 + 0.004 + (NA_PER_30G / 30 / NA_TABLE));
  }

  const { malt, fruc, citric, naTargetTotal, tableG, waterMl, totalVolumeMl, dryMixG } = getRecipeValues(totalCarbs);

  let basisLabel = 'Maltodextrin';
  if (bulkBasis === 'fruc') basisLabel = 'Fructose';
  if (bulkBasis === 'carbs') basisLabel = 'Total Carbs';
  if (bulkBasis === 'dry') basisLabel = 'Pre-mixed Dry Ingredients';

  let html = `
    <div class="recipe-section">
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
        <tr><td>Water (if mixing all at once)</td><td>${waterMl} ml</td><td></td></tr>
        <tr style="border-top: 2px solid #ddd; font-weight: 600;"><td>Pre-mixed Dry Ingredients</td><td>${Math.round(dryMixG)} g</td><td></td></tr>
      </table>

      <p class="small" style="margin-top:8px; text-align:center;">
        Build a large dry batch once, then weigh out the needed dry grams later and add water separately.
      </p>
    </div>
    <div class="pills-container">
      <div class="pill">Total carbs: <strong>${Math.round(totalCarbs)}</strong> g</div>
      <div class="pill">Sodium total: <strong>${Math.round(naTargetTotal)}</strong> mg</div>
      <div class="pill">Final gel volume: <strong>${totalVolumeMl}</strong> ml</div>
    </div>
  `;

  document.getElementById('out').innerHTML = html;
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
  
  calculate();
};
