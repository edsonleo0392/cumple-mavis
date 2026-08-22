MAVIS V4.2.5 — POST-CONFIRM FLOW + DEADLINE UI

Cambios:
- Tras guardar exitosamente, el modal se cierra automáticamente.
- Una respuesta existente cambia el CTA principal a “Editar mi invitación”.
- Al volver a abrir, la pantalla se presenta como edición y precarga la respuesta vigente.
- Si el backend reporta una fecha límite, se muestra en lenguaje natural.
- Después de la fecha límite, la UI queda en modo consulta y el backend sigue bloqueando escrituras.
- No se modifica Apps Script R4.0 ni el contrato de datos.

CONFIGURACION REQUERIDA EN GOOGLE SHEETS:
RSVP_DEADLINE = 2026-09-13
El backend R4.0 ya interpreta la fecha como inclusiva en America/Guatemala.
