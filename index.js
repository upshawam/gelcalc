const NA_TABLE = 390; // mg sodium per gram table salt
const DEFAULT_FUELING = 1.0;   // g/kg/h
const DEFAULT_SODIUM  = 300;   // mg/h (halved from 600)

// DIY gel assumptions
const DIY_CARBS_PER_GEL = 30;
const DIY_COST_PER_GEL  = 0.32;

// Commercial gels
const PRODUCTS = [
  { name: "DIY Gel", carbs: 30, cost: DIY_COST_PER_GEL },
  { name: "Precision Gels", carbs: 30, cost: 2.88 },
  { name: "Maurten GEL 100", carbs: 40, cost: 4.50 }
];

// Volume factors (ml per gram dissolved)
const VOL_PER_G_CARBS = 0.62;
const VOL_PER_G_SALT  = 0.35;
const VOL_PER_G_CITRIC= 0.8;

function asKg(weight, unit) {
  return unit === 'kg' ? weight : weight * 0.453592;
}

function buildPaceOptions() {
  const paceSelect = document.getElementById('pace');
  for (let min = 6; min <= 15; min++) {
    for (let sec = 0; sec < 60; sec += 15) {
      const label = `${min}:${sec.toString().padStart(2,'0')}`;
      const opt = document.createElement('option');
      opt.value = min + sec/60; // pace in minutes per mile
      opt.textContent = label;
      paceSelect.appendChild(opt);
    }
  }
  paceSelect.value = 8; // default ~8:00/mi
}

function buildDistanceOptions() {
  const whole = document.getElementById('milesWhole');
  const decimal = document.getElementById('milesDecimal');
  for (let i = 1; i <= 100; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i;
    whole.appendChild(opt);
  }
  for (let d = 0; d <= 9; d++) {
    const opt = document.createElement('option');
    opt.value = d / 10;
    opt.textContent = d;
    decimal.appendChild(opt);
  }
  whole.value = 10;
  decimal.value = 0;
}

function calculate() {
  const weight = parseFloat(document.getElementById('weight').value || 0);
  const unit = document.getElementById('weightUnit').value;
  const kg = asKg(weight, unit);

  const miles = parseInt(document.getElementById('milesWhole').value) +
                parseFloat(document.getElementById('milesDecimal').value);
  const pace = parseFloat(document.getElementById('pace').value); // minutes per mile
  const durationH = (miles * pace) / 60;

  // Carbs
  const totalCarbs = kg * DEFAULT_FUELING * durationH;
  const carbsPerHour = durationH > 0 ? totalCarbs / durationH : 0;
  const malt = totalCarbs * (2/3);
  const fruc = totalCarbs * (1/3);

  // Citric acid scaling (0.4 g per 100 g carbs)
  const citric = totalCarbs * 0.004;

  // Sodium (halved target, table salt only)
  const naTargetPerHour = DEFAULT_SODIUM;
  const naTargetTotal = naTargetPerHour * durationH;
  const tableG = naTargetTotal / NA_TABLE;
  const naTotal = tableG * NA_TABLE;

  // Water heuristic
  const waterMl = Math.round(110 + Math.max(0, totalCarbs - 120) * 0.2);

  // Volume estimate
  const totalVolumeMl = Math.round(
    waterMl +
    (totalCarbs * VOL_PER_G_CARBS) +
    (tableG * VOL_PER_G_SALT) +
    (citric * VOL_PER_G_CITRIC)
  );

  // Build recipe + outputs
  let html = `
    <hr>
    <table class="recipe-table">
      <tr><th>Ingredient</th><th>Amount</th></tr>
      <tr><td>Maltodextrin</td><td>${malt.toFixed(0)} g</td></tr>
      <tr><td>Fructose</td><td>${fruc.toFixed(0)} g</td></tr>
      <tr><td>Table Salt</td><td>${tableG.toFixed(2)} g</td></tr>
      <tr><td>Citric Acid</td><td>${citric.toFixed(2)} g</td></tr>
      <tr><td>Water</td><td>${waterMl} ml</td></tr>
    </table>

    <div class="pill">Total carbs: <strong>${Math.round(totalCarbs)}</strong> g</div>
    <div class="pill">Carbs/hour: <strong>${Math.round(carbsPerHour)}</strong> g/h</div>
    <div class="pill">Sodium total: <strong>${Math.round(naTotal)}</strong> mg</div>
    <div class="pill">Estimated total volume: <strong>${totalVolumeMl}</strong> ml</div>
  `;

  // Cost comparison (simplified)
  html += `
    <h2>Cost comparison</h2>
    <div class="table-container">
      <table class="table">
        <tr><th>Product</th><th>Total activity cost</th></tr>
  `;

  PRODUCTS.forEach(p => {
    const gelsNeeded = Math.ceil(totalCarbs / p.carbs);
    const totalCost = gelsNeeded * p.cost;

    if (p.name === "DIY Gel") {
      // Just show cost, no gel count
      html += `
        <tr>
          <td>${p.name}</td>
          <td>$${totalCost.toFixed(2)}</td>
        </tr>
      `;
    } else {
      // Show cost + gel count for commercial products
      html += `
        <tr>
          <td>${p.name}</td>
          <td>$${totalCost.toFixed(2)} (for ${gelsNeeded} gels)</td>
        </tr>
      `;
    }
  });

  html += `</table></div>
    <div class="small">DIY cost assumes ${DIY_CARBS_PER_GEL} g carbs per gel-equivalent for comparison only.</div>
  `;

  document.getElementById('out').innerHTML = html;
}

window.onload = () => {
  buildPaceOptions();
  buildDistanceOptions();
  document.getElementById('weight').value = 170;
  calculate();
};
