# Precio del eucalipto en Galicia

Web estática para consultar la última referencia pública encontrada del precio del eucalipto **en pie**, en €/tonelada, centrada en árboles de más de 35 cm y separando `Eucalyptus globulus` y `Eucalyptus nitens`.

## Ejecutar localmente

Necesita un servidor estático porque la web carga `data/prices.json` con `fetch`.

```bash
npx serve .
```

También funciona en cualquier alojamiento estático. En GitHub Pages basta con publicar la rama principal. El flujo `.github/workflows/update-data.yml` intenta actualizar los datos cada lunes y también permite lanzarlo manualmente.

El despliegue público se realiza mediante `.github/workflows/pages.yml`.

## Datos y criterio

- La fuente principal actual es Maderera Frouxeira: referencia publicada el 1 de septiembre de 2026, basada en contratos recientes de A Coruña y Lugo.
- Las cifras se mantienen como horquillas. No se presenta un promedio inventado como si fuese una cotización oficial.
- El gráfico muestra todas las referencias públicas comparables disponibles para más de 35 cm, con su fuente y fecha. No se interpolan meses sin dato ni se inventan observaciones para aparentar una serie más precisa.
- La Xunta aparece como fuente institucional de contexto, pero sus datos publicados para subastas están en €/m³ y no se convierten a €/t.
- La actualización automática falla de forma segura si cambia la estructura de la página fuente; no sobrescribe el JSON con datos incompletos.

La fecha, unidad, condición de venta y enlace a la fuente se muestran en la interfaz para que la antigüedad del dato sea visible. La actualización automática está programada semanalmente; al publicar el proyecto en GitHub, la tarea consultará la página fuente cada lunes y guardará solo tablas completas.
