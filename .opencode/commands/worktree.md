---
description: Crear git worktree en .worktrees/
---

Recibes este argumento: $ARGUMENTS

Reglas estrictas e innegociables:
1. Si el argumento está vacío o solo tiene espacios, responde en español pidiendo el nombre y NO ejecutes ningún comando.
2. Si hay argumento, normalízalo así para obtener <nombre>:
   - recorta espacios al inicio/fin
   - pasa todo a minúsculas
   - translitera acentos/ñ (á->a, é->e, í->i, ó->o, ú->u, ñ->n)
   - reemplaza cada secuencia de espacios/tabs por un solo guion `-`
   - elimina todo carácter que no sea `a-z`, `0-9`, `-`, `_`
   - colapsa múltiples `-` en uno y recorta `-` al inicio/fin
   - Ejemplo: `Mi Nueva Feature` -> `mi-nueva-feature`
3. Ejecuta ÚNICAMENTE este comando vía bash, sin cambiar de directorio:
   git worktree add .worktrees/<nombre>
4. PROHIBIDO: cambiar de directorio con `cd`/`Set-Location`, crear ramas extra, hacer checkout, instalar dependencias, editar archivos o correr cualquier otro comando.
5. Al terminar, responde solo con la ruta creada y el nombre normalizado.
