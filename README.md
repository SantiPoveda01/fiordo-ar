# FIORDO — Realidad Aumentada

Experiencia web de realidad aumentada para **FIORDO**, loción facial para hombre inspirada en los fiordos escandinavos ("Frescura del Norte").

Proyecto de Realidades Expandidas — Santiago Poveda · Juan Diego Acosta · Prof. Javier Rivera.

## Cómo usarla

1. Abre el sitio publicado en el celular (https).
2. Pulsa **Iniciar experiencia** y permite el acceso a la cámara.
3. Apunta a la imagen de seguimiento [`assets/marker/fiordo-target.png`](assets/marker/fiordo-target.png) (impresa o en otra pantalla).
4. Aparece el frasco FIORDO en 3D con su empaque, cristales de hielo y bruma. Toca el frasco para girarlo.
5. Usa los botones **Origen**, **Fórmula** y **Ritual** para ver la información del producto.
6. El botón ✳ cambia al **filtro facial ICE** (escarcha en pómulos y sienes) con la cámara frontal.

## Contenido

| Parte | Archivo |
| --- | --- |
| Pantalla de inicio, HUD y diálogos | `index.html`, `css/style.css` |
| Lógica de la experiencia | `js/main.js` |
| Frasco, caja y efectos 3D (Three.js) | `js/product.js`, `js/textures.js` |
| Textos de los 3 diálogos | `js/content.js` |
| Filtro facial ICE | `js/face.js` |
| Sonidos (Web Audio) | `js/audio.js`, `assets/audio/` |
| Imagen de seguimiento | `assets/marker/fiordo-target.png` + `targets.mind` |

## Herramientas (`tools/`)

- `marker.html` + `render.cjs`: genera la imagen de seguimiento.
- `compile.html` + `compile.cjs`: compila `targets.mind` con el compilador de MindAR.
- `sounds.py`: sintetiza los sonidos (obra original del proyecto).
- `e2e.cjs`: prueba de extremo a extremo con una cámara simulada que muestra el marcador.

## Créditos y licencias

- [MindAR](https://github.com/hiukim/mind-ar-js) 1.2.5 — MIT.
- [Three.js](https://threejs.org) r160 — MIT.
- Tipografías Oswald e Inter — SIL Open Font License (ver `assets/fonts/`).
- Sonidos: sintetizados para este proyecto (`tools/sounds.py`), sin material de terceros.
- Filtro facial: modelo Face Landmarker de MediaPipe (Apache 2.0), cargado desde CDN.
