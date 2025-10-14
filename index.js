// Constants
const NA_TABLE = 390; // mg sodium per gram table salt
const DEFAULT_FUELING = 1.0;   // g/kg/h

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

function asKg(weight, unit) {
  return unit === 'kg' ? weight : weight * 0.453592;
}

function buildPaceOptions() {
  const paceSelect = document.getElementById('pace');
  for (let min = 6; min <= 15; min++) {
    for (let sec = 0; sec < 60; sec += 15) {
      const label = `${min}:${sec.toString().padStart(2,'0')}`;
      const opt = new Option(label, min + sec/60);
      paceSelect.add(opt);
    }
  }
  paceSelect.value = 8; // default ~8:00/mi
}

function buildDistanceOptions() {
  const whole = document.getElementById('milesWhole');
  const decimal = document.getElementById('milesDecimal');
  for (let i = 1; i <= 100; i++) whole.add(new Option(i, i));
  for (let d = 0; d <= 9; d++) decimal.add(new Option(d, d/10));
  whole.value = 10;
  decimal.value = 0;
}

function calculate() {
  const weight = parseFloat(document.getElementById('weight').value || 0);
  const unit = document.getElementById('weightUnit').value;
  const kg = asKg(weight, unit);

  const miles = +document.getElementById('milesWhole').value +
                +document.getElementById('milesDecimal').value;
  const pace = parseFloat(document.getElementById('pace').value);
  const durationH = (miles * pace) / 60;

  // Carbs
  const totalCarbs = kg * DEFAULT_FUELING * durationH;
  const carbsPerHour = durationH > 0 ? totalCarbs / durationH : 0;
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

  // Build recipe card with aligned cart column
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
      </table>

      <!-- Why these ingredients link -->
      <p class="small" style="margin-top:8px; text-align:center;">
        <a href="ingredients.html" target="_blank" rel="noopener noreferrer">
          Why these ingredients?
        </a>
      </p>
    </div>
    <div class="pills-container">
      <div class="pill">Total carbs: <strong>${Math.round(totalCarbs)}</strong> g</div>
      <div class="pill">Carbs/hour: <strong>${Math.round(carbsPerHour)}</strong> g/h</div>
      <div class="pill">Sodium total: <strong>${Math.round(naTargetTotal)}</strong> mg</div>
      <div class="pill">Final gel volume: <strong>${totalVolumeMl}</strong> ml</div>
    </div>
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

window.onload = () => {
  buildPaceOptions();
  buildDistanceOptions();
  document.getElementById('weight').value = 170;
  calculate();
};
