# Adaptación inicial - Essenza Fragancia

Este paquete reemplaza la identidad original del template por Essenza Fragancia.

## Cambios incluidos

- Marca, nombre, segmento y claves de localStorage.
- Home con estética premium para perfumería.
- Catálogo inicial con productos, precios, ofertas, destacados, nuevos y sin stock.
- Categorías de la tienda actual: Diseñador, Árabes, Nicho, Decants y Combo Decants.
- WhatsApp principal: 543572585775.
- Mensajes de transferencia/depósito y envío por VIA CARGO.
- Imágenes SVG placeholder para los productos.
- Defaults del backend y seed para arrancar con datos de Essenza.

## Cómo aplicar

Copiá el contenido de este ZIP sobre la raíz del repo `essenzafragancia`, aceptando reemplazar archivos.

Después probá:

```powershell
cd front
npm install
npm run build
```

Si el proyecto usa backend/Supabase, corré el seed o reiniciá el backend según tu flujo actual:

```powershell
cd ../back
npm install
npm run seed
```

## Próximo paso sugerido

Revisar la ficha de producto y checkout para mostrar mejor:
- precio regular
- precio por transferencia
- cuotas
- estado sin stock
- coordinación de envío por WhatsApp
