# Optikalejandría en ubicación

La capa Comercio muestra Optikalejandría S.A.S, Cra 52 #130 Sur-40,
Caldas, Antioquia, teléfono 302 373 1382.

Coordenadas publicadas: 6.0912953, -75.6375736.
Verificadas el 27 de octubre de 2026 en https://www.aiyellow.com/optikalejandria/:
el enlace de indicaciones usa
`https://www.google.com/maps/dir/?api=1&destination=6.091295300000001,%20-75.6375736`
y el marcador de esa ficha usa el mismo `google.maps.LatLng`.
La ficha también coincide con la dirección y el teléfono solicitados.
Es una ubicación publicada por el directorio, no una medición topográfica.

No se añaden distancias ni tiempos de recorrido para este comercio.

`locationData.ts` comparte los tipos y datos entre el mapa y la lista sin
importar Leaflet durante SSR. `resolveLocationLayers` conserva las capas y
puntos del CMS, añade Comercio si no existe y normaliza este comercio a una
sola entrada con los datos verificados, incluso con configuraciones antiguas.
El JSON del sitio también contiene el punto para nuevas instalaciones.

El mapa vuelve a activar la capa seleccionada cuando cambia la configuración.
Las ventanas del mapa muestran texto del CMS como texto y omiten metadatos
vacíos. La lista permite seleccionar los puntos con el teclado y ya no añade
«caminando» a tiempos cuyo modo de transporte no está especificado.

## Comprobación

Con Node 22.18 o posterior (soporte nativo de TypeScript):

```sh
node --test tests/location-data.test.mjs
npx eslint src/components/praga/MapView.tsx src/components/praga/Ubicacion.tsx src/components/praga/locationData.ts tests/location-data.test.mjs
npx prisma generate
npm run build
```

Las pruebas cubren configuración ausente, nula, vacía, antigua, sin Comercio,
duplicada y el JSON del sitio; verifican conservación de puntos personalizados,
coordenadas, ausencia de estimaciones y que no se modifique el objeto del CMS.

## Resultado de verificación local (2026-10-27)

- 9 pruebas de datos aprobadas; ESLint de archivos modificados sin errores.
- Compilación de producción y TypeScript completados.
- `/api/site-config` entrega el punto con coordenadas y contacto correctos.
- Página compilada: Comercio muestra 4 marcadores; la tarjeta del comercio
  muestra dirección y teléfono, sin distancia ni tiempo.
- Selección con Enter y apertura del pin comprobadas en el navegador;
  la ventana muestra los datos y el enlace `tel:3023731382`.
- La prueba local usa el respaldo estático del API, sin credenciales de la base
  de datos de producción. NextAuth informa falta de configuración local;
  ese servicio no participa en el mapa público.
- Navegador con `/api/site-config` respondiendo `null`: el comercio y sus
  datos se muestran y Comercio tiene 4 pines.
- Navegador con CMS antiguo sin el comercio y respuesta retrasada: al recibir
  la configuración, Comercio sigue activo y muestra los 4 pines y la ficha.
