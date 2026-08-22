CUMPLE MAVIS V3.4 - MOBILE LAYOUT + OPENING FLOW FIX
====================================

Contenido:
- index.html
- styles.css
- script.js
- assets/

Backend RSVP configurado:
https://script.google.com/macros/s/AKfycbxiHfl1I-xEvFK4c41OLd4IMY9CxH6CwP9xyQs7xCLCrM6OEu-J_VSE_RcHjI_2mbjTGA/exec

URL pública prevista:
https://edsonleo0392.github.io/cumple-mavis/

DESPLIEGUE EN GITHUB PAGES
1. Sustituye en la raíz del repositorio los archivos index.html, styles.css y script.js.
2. Sustituye la carpeta assets/ por la incluida en este ZIP.
3. No subas a GitHub listas de invitados, teléfonos, tokens ni enlaces personalizados.
4. Abre la URL pública sin ?i= para revisar el diseño general.
5. Para probar RSVP usa un token QA vigente:
   https://edsonleo0392.github.io/cumple-mavis/?i=<TOKEN_QA>

SEGURIDAD / PRIVACIDAD
- El token solo se lee desde ?i=.
- No hay nombres ni teléfonos en el frontend.
- Referrer-Policy: no-referrer.
- Los enlaces externos usan noreferrer/noopener.
- La lectura de estado usa JSONP.
- La escritura RSVP usa POST a Apps Script mediante formulario oculto y verifica el resultado consultando nuevamente el estado.
- La interfaz respeta prefers-reduced-motion.

EVENTO
Mavis Isabella Ramírez · 5 años
Domingo 20/09/2026 · 9:30 a. m.
McDonald's
6A Avenida 10-56, Zona 1 (Cerca de Plaza Vivar)


FIX V3.3
- Corrige el cuadro en blanco entre la apertura del sobre y la tarjeta.
- La apertura ahora tiene acercamiento, apertura de solapa, salida de carta y destello.
- La tarjeta empieza a aparecer antes de que desaparezca la escena inicial.
- El medallón superior quedó fuera del contenedor recortado del pergamino, por lo que ya no se corta.
- Mantiene intacta la integración RSVP R3.2.


FIX V3.4
- Intro fixed: no deja un viewport vacio en el documento.
- Scroll normal inmediatamente al abrir la invitacion.
- Sobre centrado en movil.
- Tarjeta reducida a 88vw con tipografia y espaciados compactos.
- Medallon superior mas pequeno y sin recorte.
- RSVP R3.2 sin cambios.

V3.5: Moana centrada arriba del sobre en móvil; sobre mantiene su posición. RSVP sin cambios.

V3.6
- Moana 28% más grande en móvil.
- Moana sube aproximadamente 90–110 px respecto a V3.5.
- El sobre conserva exactamente su posición.
- RSVP R3.2 sin cambios.
