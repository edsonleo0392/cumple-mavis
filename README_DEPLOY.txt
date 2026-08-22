CUMPLE MAVIS V4.2 — RSVP VISUAL MENU SELECTION

BASE:
- Derivada de V4.1 estable.
- Intro, Moana, sobre, animación, tarjeta, Maps y diseño principal no se modifican.
- RSVP familiar mantiene Token, Revision, RequestID, LockService, auditoría e idempotencia.

NUEVO FLUJO RSVP:
1. Asistencia: elegir cantidad de adultos y niños.
2. Menús: una persona a la vez.
3. Revisar: resumen familiar antes de guardar.

NOTA FAMILIAR:
"Una invitación por familia. La primera respuesta quedará registrada como confirmación familiar. Si necesitan hacer algún cambio, pueden volver a este mismo enlace y actualizarla."

CATÁLOGO ADULTOS:
- Big Mac
- Cuarto de Libra
- Big Tasty
- McFizz Rosa
- McFizz Azul
- McFizz Verde

CATÁLOGO NIÑOS:
- Cajita Feliz de Quesoburguesa
- Cajita Feliz de Nuggets
- Jamaica
- Naranja
- Manzana

NO SE MUESTRAN PRECIOS.

BACKEND REQUERIDO:
- Mavis RSVP R4.0 Menu Selection.
- Inicializar R4 crea/actualiza:
  * CatalogoMenu
  * SeleccionesMenu
- Un RSVP CONFIRMADO requiere exactamente un menú y una bebida por asistente.
- NO_ASISTE elimina las selecciones de menú de la invitación.
- Cambiar únicamente un menú/bebida también incrementa Revision.

DESPLIEGUE:
1. Primero reemplazar Code.gs por Mavis_RSVP_R4_0_Menu_Selection_Code.gs.
2. Ejecutar initializeR4 una sola vez.
3. Ejecutar runDeploymentPreflightR4 y exigir PASS.
4. Actualizar el deployment existente del Web App a una nueva versión (misma URL).
5. Reemplazar el contenido del repo GitHub Pages por este ZIP frontend.
6. Probar con el LinkPersonal vigente de INV-0010 antes de enviar invitaciones reales.

CACHE BUST DE QA:
https://edsonleo0392.github.io/cumple-mavis/?v=42
