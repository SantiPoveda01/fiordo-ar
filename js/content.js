// Contenido de los 3 diálogos de información de FIORDO.
// Fuente: presentación del producto (diapositivas 2, 3, 4, 7 y 9).

export const DIALOGS = {

	origen: {
		kicker: '01 — Origen',
		title: 'Nacida en los fiordos del norte',
		html: `
			<p>FIORDO es una <strong>loción facial para hombre</strong> inspirada en los fiordos escandinavos: hielo, piedra, agua fría y aire puro. Una marca minimalista y de alto contraste, lejos de lo floral y lo cálido, creada para transmitir <strong>frescura, limpieza y carácter</strong>.</p>
			<ul class="d-list">
				<li><span class="d-num">01</span><div><b>Paleta fría</b><span>Azul marino y blanco hielo, con un celeste puntual que aporta frescura.</span></div></li>
				<li><span class="d-num">02</span><div><b>Geometría escandinava</b><span>El símbolo une montaña y horizonte: el encuentro entre la roca y el agua del fiordo.</span></div></li>
				<li><span class="d-num">03</span><div><b>Sensación del norte</b><span>Aire, agua y niebla: un acabado mate, mineral y limpio.</span></div></li>
			</ul>
			<div class="d-swatches" aria-label="Paleta de colores FIORDO">
				<i style="background:#1B2A35" title="Azul-gris oscuro"></i>
				<i style="background:#E8EEF1" title="Blanco hielo"></i>
				<i style="background:#8FB8C9" title="Celeste"></i>
				<i style="background:#5E6E75" title="Gris pizarra"></i>
				<i style="background:#0D1418" title="Casi negro"></i>
				<i style="background:#B7BFC3" title="Gris niebla"></i>
			</div>`,
		effect: 'shards',
	},

	formula: {
		kicker: '02 — Fórmula',
		title: 'Agua termal + mentol',
		html: `
			<p>Loción hidratante de <strong>acción refrescante</strong>, inspirada en la pureza del agua glacial. Su ingrediente destacado combina <strong>agua termal y mentol</strong>, responsables del efecto frío característico del producto.</p>
			<div class="d-stat"><svg class="d-ice" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20M3.3 7l17.4 10M20.7 7L3.3 17M12 6l-2.5-2.5M12 6l2.5-2.5M12 18l-2.5 2.5M12 18l2.5 2.5"/></svg><span>El mentol activa la sensación de frío al contacto con la piel: la frescura del norte en cada aplicación.</span></div>
			<ul class="d-list">
				<li><span class="d-num">01</span><div><b>Hidratación instantánea</b><span>Hidrata la piel desde la primera aplicación.</span></div></li>
				<li><span class="d-num">02</span><div><b>Efecto refrescante</b><span>Alivia y despierta el rostro, como el aire frío del fiordo.</span></div></li>
				<li><span class="d-num">03</span><div><b>Absorción rápida</b><span>Textura ligera, sin sensación grasosa.</span></div></li>
			</ul>`,
		effect: 'mist',
	},

	ritual: {
		kicker: '03 — Ritual',
		title: 'El ritual después del afeitado',
		html: `
			<p>Aplica FIORDO sobre el <strong>rostro limpio</strong>, con <strong>movimientos ascendentes</strong>. Es ideal para usar después del afeitado, cuando la piel pide calma y frescura.</p>
			<ul class="d-list">
				<li><span class="d-num">01</span><div><b>Limpia</b><span>Parte de un rostro limpio, recién afeitado.</span></div></li>
				<li><span class="d-num">02</span><div><b>Aplica</b><span>Extiende la loción con movimientos ascendentes, de la mandíbula hacia las sienes.</span></div></li>
				<li><span class="d-num">03</span><div><b>Siente</b><span>Deja que el frío del mentol haga su trabajo. Listo, sin brillo ni residuos.</span></div></li>
			</ul>
			<div class="d-chips" aria-label="Calidad del empaque">
				<span>Vidrio en degradado</span><span>Tapa de acero cepillado</span><span>Acabado mate</span>
			</div>
			<p>El frasco va del azul profundo en la parte superior al vidrio transparente en la base, con una tapa esférica de acero cepillado: calidad que se siente en la mano.</p>`,
		effect: 'spin',
	},
};

export const DIALOG_ORDER = ['origen', 'formula', 'ritual'];
