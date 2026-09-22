const state = { data: null };
state.historyMonths = null;
const species = { globulus: { name: "Eucalyptus globulus", short: "Globulus" }, nitens: { name: "Eucalyptus nitens", short: "Nitens" } };

const money = value => `${value} €/t`;
const dateLabel = value => new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T12:00:00`));
const sourceById = id => state.data.sources.find(source => source.id === id);

function renderCards() {
  const source = sourceById(state.data.primarySourceId);
  const orderedSpecies = [["nitens", species.nitens], ["globulus", species.globulus]];
  document.querySelector("#price-cards").innerHTML = orderedSpecies.map(([key, meta]) => {
    const range = state.data.prices[key].large;
    const trend = state.data.trend[key];
    const trendText = trend === "down" ? "↓ baja frente a mayo" : "→ estable frente a mayo";
    const saleEstimate = `<div class="sale-estimate"><span>Valor orientativo de 225 toneladas</span><strong>${(225 * range.low).toLocaleString("es-ES")}–${(225 * range.high).toLocaleString("es-ES")} €</strong><small>Antes de cualquier ajuste concreto del monte</small></div>`;
    return `<article class="price-card ${key === "nitens" ? "featured" : "secondary"}"><div class="card-top"><div>${key === "nitens" ? '<div class="featured-label">Especie destacada</div>' : ""}<h2 class="species">${meta.name}</h2><div class="species-latin">Más de 35 cm de diámetro</div></div><span class="trend ${trend}">${trendText}</span></div><div class="price-range">${range.low}–${range.high} <small>€/t</small></div>${saleEstimate}<div class="card-bottom"><span>Último dato<br /><strong>${dateLabel(state.data.lastUpdated)}</strong></span><a href="${source.url}" target="_blank" rel="noreferrer">Ver fuente ↗</a></div></article>`;
  }).join("");
}

function renderFreshness() {
  const updated = new Date(`${state.data.lastUpdated}T12:00:00`);
  const today = new Date();
  const age = Math.max(0, Math.floor((today - updated) / 86400000));
  const freshness = document.querySelector("#freshness-label");
  freshness.textContent = age === 0 ? "dato de hoy" : `dato de hace ${age} días`;
  freshness.className = age > 30 ? "stale-data" : "";
  document.querySelector("#update-check").textContent = `Última comprobación: ${dateLabel(state.data.lastChecked)} · ${state.data.updateStatus === "success" ? "correcta" : "requiere revisión"}`;
}

function renderChart() {
  const svg = document.querySelector("#history-chart");
  const cutoff = state.historyMonths === null ? null : new Date();
  if (cutoff) cutoff.setMonth(cutoff.getMonth() - state.historyMonths);
  const inRange = item => !cutoff || new Date(`${item.date}T12:00:00`) >= cutoff;
  const nitens = state.data.history.filter(item => item.species === "nitens" && inRange(item));
  const globulus = state.data.history.filter(item => item.species === "globulus" && inRange(item));
  const nitensVisible = nitens.length ? nitens : state.data.history.filter(item => item.species === "nitens").slice(-1);
  const globulusVisible = globulus.length ? globulus : state.data.history.filter(item => item.species === "globulus").slice(-1);
  const points = nitensVisible;
  const values = [...nitensVisible, ...globulusVisible].flatMap(point => [point.low, point.high]); const min = Math.min(...values) - 3; const max = Math.max(...values) + 3;
  const x = index => 70 + index * ((700 - 70) / Math.max(points.length - 1, 1)); const y = value => 205 - ((value - min) / (max - min)) * 155;
  const labels = [28, 30, 32, 34, 36, 38, 40];
  const grid = labels.map(value => `<line class="grid-line" x1="55" x2="730" y1="${y(value)}" y2="${y(value)}"/><text class="chart-label" x="8" y="${y(value) + 4}">${value}</text>`).join("");
  const series = (items, cls, showValues) => {
    const highPath = items.map((point,index) => `${x(index)},${y(point.high)}`).join(" "); const lowPath = items.map((point,index) => `${x(index)},${y(point.low)}`).join(" ");
    const area = `${items.map((point,index)=>`${x(index)},${y(point.high)}`).join(" ")} ${[...items].reverse().map((point,index)=>`${x(items.length-1-index)},${y(point.low)}`).join(" ")}`;
    const marks = items.map((point,index) => `<circle class="chart-point ${cls}" cx="${x(index)}" cy="${y((point.low+point.high)/2)}" r="${showValues ? 5 : 4}"/>${showValues ? `<text class="chart-value ${cls}" text-anchor="middle" x="${x(index)}" y="${y(point.high)-12}">${point.low}–${point.high}</text>` : ""}`).join("");
    return `<polygon class="chart-area ${cls}" points="${area}"/><polyline class="chart-line ${cls}" points="${highPath}"/><polyline class="chart-line ${cls}" points="${lowPath}"/>${marks}`;
  };
  const dates = points.map(point => `<text class="chart-label" text-anchor="middle" x="${x(points.indexOf(point))}" y="235">${point.label}</text>`).join("");
  svg.innerHTML = `${grid}${series(globulusVisible, "globulus", false)}${series(nitensVisible, "nitens", true)}${dates}`;
  const visibleCount = Math.max(nitens.length, globulus.length);
  const periodLabel = state.historyMonths === null ? "lecturas disponibles" : "referencias en este periodo";
  document.querySelector("#chart-description").textContent = visibleCount < 2 ? `Nitens destacado · ${visibleCount} referencia disponible en este periodo` : `Nitens destacado · >35 cm · ${visibleCount} ${periodLabel}`;
}

function renderSources() {
  document.querySelector("#source-list").innerHTML = state.data.sources.map(source => `<article class="source-item"><div class="source-type">${source.type}</div><h3 class="source-title"><a href="${source.url}" target="_blank" rel="noreferrer">${source.title} ↗</a></h3><p>${source.date}. ${source.description}</p></article>`).join("");
}

function renderRecommendation() {
  const history = state.data.history.filter(item => item.species === "nitens").sort((a, b) => a.date.localeCompare(b.date));
  if (history.length < 2) {
    document.querySelector("#recommendation-badge").textContent = "Datos insuficientes";
    document.querySelector("#recommendation-card").innerHTML = "<div class=\"recommendation-lead\"><strong>Aún no hay dos referencias comparables para emitir una señal.</strong><span>La recomendación aparecerá cuando se incorpore otro dato histórico.</span></div>";
    return;
  }
  const current = history[history.length - 1]; const previous = history[history.length - 2];
  const currentMid = (current.low + current.high) / 2; const previousMid = (previous.low + previous.high) / 2;
  const change = ((currentMid - previousMid) / previousMid) * 100;
  const badge = document.querySelector("#recommendation-badge"); const card = document.querySelector("#recommendation-card");
  if (change < -1) {
    badge.textContent = "Prudencia"; badge.className = "recommendation-badge caution";
    card.innerHTML = `<div class="recommendation-lead"><strong>Si no tienes prisa, esperaría o pediría varias ofertas antes de cerrar.</strong><span>La señal disponible para nitens es ligeramente desfavorable.</span></div><div class="recommendation-grid"><div><span class="recommendation-label">Qué ha cambiado</span><p>La horquilla reciente es de <strong>${current.low}–${current.high} €/t</strong>, frente a ${previous.low}–${previous.high} €/t en la referencia anterior. El punto medio ha variado un ${Math.abs(change).toFixed(1).replace(".", ",")} % a la baja.</p></div><div><span class="recommendation-label">Qué haría</span><p>Solicitaría ofertas a varios compradores y negociaría el lote, pero evitaría vender con la primera oferta si no necesitas liquidez inmediata.</p></div></div>`;
  } else if (change > 1) {
    badge.textContent = "Señal favorable"; badge.className = "recommendation-badge positive";
    card.innerHTML = `<div class="recommendation-lead"><strong>Es un momento razonable para pedir ofertas y valorar la venta.</strong><span>La referencia de nitens ha mejorado frente al dato anterior.</span></div><div class="recommendation-grid"><div><span class="recommendation-label">Qué ha cambiado</span><p>La horquilla reciente es de <strong>${current.low}–${current.high} €/t</strong> y el punto medio ha subido un ${change.toFixed(1).replace(".", ",")} %.</p></div><div><span class="recommendation-label">Qué haría</span><p>Compararía varias ofertas y comprobaría por escrito quién asume corta, saca, transporte, certificación e impuestos.</p></div></div>`;
  } else {
    badge.textContent = "Mercado estable"; badge.className = "recommendation-badge neutral";
    card.innerHTML = `<div class="recommendation-lead"><strong>No hay una señal clara para esperar una subida inmediata.</strong><span>El mercado se mantiene estable en las referencias disponibles.</span></div><div class="recommendation-grid"><div><span class="recommendation-label">Qué significa</span><p>El rango reciente es de <strong>${current.low}–${current.high} €/t</strong> y apenas cambia frente a la referencia anterior.</p></div><div><span class="recommendation-label">Qué haría</span><p>Pediría varias ofertas y decidiría según la urgencia, el acceso al monte y la calidad del lote.</p></div></div>`;
  }
}

async function init() {
  const response = await fetch("data/prices.json"); state.data = await response.json();
  document.querySelector("#updated-label").textContent = `Dato publicado el ${dateLabel(state.data.lastUpdated)}`;
  document.querySelector("#data-version").textContent = `Datos: ${dateLabel(state.data.lastUpdated)}`;
  renderCards(); renderFreshness(); renderChart(); renderSources(); renderRecommendation();
  document.querySelector("#history-range").addEventListener("change", event => { state.historyMonths = event.target.value === "all" ? null : Number(event.target.value); renderChart(); });
}
init().catch(error => { document.querySelector("#updated-label").textContent = "No se han podido cargar los datos"; console.error(error); });
