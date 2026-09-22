const state = { data: null };
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

function renderChart() {
  const svg = document.querySelector("#history-chart");
  const nitens = state.data.history.filter(item => item.species === "nitens");
  const globulus = state.data.history.filter(item => item.species === "globulus");
  const points = nitens;
  const values = [...nitens, ...globulus].flatMap(point => [point.low, point.high]); const min = Math.min(...values) - 3; const max = Math.max(...values) + 3;
  const x = index => 70 + index * ((700 - 70) / (points.length - 1)); const y = value => 205 - ((value - min) / (max - min)) * 155;
  const labels = [28, 30, 32, 34, 36, 38, 40];
  const grid = labels.map(value => `<line class="grid-line" x1="55" x2="730" y1="${y(value)}" y2="${y(value)}"/><text class="chart-label" x="8" y="${y(value) + 4}">${value}</text>`).join("");
  const series = (items, cls, showValues) => {
    const highPath = items.map((point,index) => `${x(index)},${y(point.high)}`).join(" "); const lowPath = items.map((point,index) => `${x(index)},${y(point.low)}`).join(" ");
    const area = `${items.map((point,index)=>`${x(index)},${y(point.high)}`).join(" ")} ${[...items].reverse().map((point,index)=>`${x(items.length-1-index)},${y(point.low)}`).join(" ")}`;
    const marks = items.map((point,index) => `<circle class="chart-point ${cls}" cx="${x(index)}" cy="${y((point.low+point.high)/2)}" r="${showValues ? 5 : 4}"/>${showValues ? `<text class="chart-value ${cls}" text-anchor="middle" x="${x(index)}" y="${y(point.high)-12}">${point.low}–${point.high}</text>` : ""}`).join("");
    return `<polygon class="chart-area ${cls}" points="${area}"/><polyline class="chart-line ${cls}" points="${highPath}"/><polyline class="chart-line ${cls}" points="${lowPath}"/>${marks}`;
  };
  const dates = points.map(point => `<text class="chart-label" text-anchor="middle" x="${x(points.indexOf(point))}" y="235">${point.label}</text>`).join("");
  svg.innerHTML = `${grid}${series(globulus, "globulus", false)}${series(nitens, "nitens", true)}${dates}`;
  document.querySelector("#chart-description").textContent = "Nitens destacado · >35 cm · comparación con globulus";
}

function renderSources() {
  document.querySelector("#source-list").innerHTML = state.data.sources.map(source => `<article class="source-item"><div class="source-type">${source.type}</div><h3 class="source-title"><a href="${source.url}" target="_blank" rel="noreferrer">${source.title} ↗</a></h3><p>${source.date}. ${source.description}</p></article>`).join("");
}

async function init() {
  const response = await fetch("data/prices.json"); state.data = await response.json();
  document.querySelector("#updated-label").textContent = `Dato publicado el ${dateLabel(state.data.lastUpdated)}`;
  document.querySelector("#data-version").textContent = `Datos: ${dateLabel(state.data.lastUpdated)}`;
  renderCards(); renderChart(); renderSources();
}
init().catch(error => { document.querySelector("#updated-label").textContent = "No se han podido cargar los datos"; console.error(error); });
