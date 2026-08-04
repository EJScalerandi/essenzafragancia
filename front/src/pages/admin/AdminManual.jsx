import React from "react";

import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PhotoLibraryOutlinedIcon from "@mui/icons-material/PhotoLibraryOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import ListAltIcon from "@mui/icons-material/ListAlt";

function PanelChip(props) {
  return (
    <Chip
      size="small"
      label="Panel"
      sx={{ bgcolor: "rgba(29,22,18,0.08)", color: "primary.main", fontWeight: 800, mb: 0.5 }}
      {...props}
    />
  );
}

function ClientChip(props) {
  return (
    <Chip
      size="small"
      label="Clienta ve"
      sx={{ bgcolor: "rgba(200,164,93,0.22)", color: "#8a6a2c", fontWeight: 800, mb: 0.5 }}
      {...props}
    />
  );
}

function CauseEffect({ cause, effect }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.75,
        mb: 1.5,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr auto 1fr" },
        gap: { xs: 0.5, sm: 1.75 },
        alignItems: "center",
      }}
    >
      <Box>
        <PanelChip />
        <Typography variant="body2" color="text.secondary">
          {cause}
        </Typography>
      </Box>
      <Typography sx={{ display: { xs: "none", sm: "block" }, color: "text.disabled", fontWeight: 900 }}>
        →
      </Typography>
      <Box>
        <ClientChip />
        <Typography variant="body2" color="text.secondary">
          {effect}
        </Typography>
      </Box>
    </Paper>
  );
}

function FieldList({ items }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "rgba(29,22,18,0.02)" }}>
      <Stack spacing={1.1} divider={<Divider flexItem />}>
        {items.map(([term, desc]) => (
          <Box
            key={term}
            sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "180px 1fr" }, gap: { xs: 0.25, sm: 1.5 } }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: "0.92rem" }}>{term}</Typography>
            <Typography color="text.secondary" variant="body2">
              {desc}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

function SectionAccordion({ icon, route, title, dek, children, defaultExpanded = true }) {
  return (
    <Accordion defaultExpanded={defaultExpanded} disableGutters sx={{ mb: 1.5, "&:before": { display: "none" } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: "100%" }}>
          {icon}
          <Box sx={{ flexGrow: 1 }}>
            <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap">
              <Typography sx={{ fontWeight: 900 }}>{title}</Typography>
              {route ? (
                <Typography
                  component="code"
                  sx={{
                    fontSize: "0.75rem",
                    color: "text.secondary",
                    bgcolor: "rgba(29,22,18,0.06)",
                    px: 0.7,
                    py: 0.1,
                    borderRadius: 1,
                  }}
                >
                  {route}
                </Typography>
              ) : null}
            </Stack>
            {dek ? (
              <Typography variant="body2" color="text.secondary">
                {dek}
              </Typography>
            ) : null}
          </Box>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>{children}</AccordionDetails>
    </Accordion>
  );
}

function GroupTitle({ eyebrow, children }) {
  return (
    <Box sx={{ mt: 4, mb: 1.5 }}>
      <Typography
        variant="overline"
        sx={{ color: "secondary.main", fontWeight: 900, letterSpacing: "0.14em" }}
      >
        {children}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: -0.3 }}>
        {eyebrow}
      </Typography>
      <Divider sx={{ mt: 1 }} />
    </Box>
  );
}

const REFERENCE_ROWS = [
  ["Crear/editar producto, precio, stock, imágenes", "Aparece o se actualiza en portada, listado y ficha; sin stock, se deshabilita “Agregar al carrito” en todo el sitio"],
  ["Tag Oferta / Destacado / Nuevo en un producto", "Ubica el producto en la sección correspondiente de la portada"],
  ["Imágenes del Hero (subir, ordenar, ocultar)", "Cambia las fotos grandes de la portada (hasta 4)"],
  ["Nombre de la tienda", "Encabezado, portada y pie de página"],
  ["Música (subir, activar, orden, modo)", "Reproductor flotante en todo el sitio público"],
  ["Links de contacto (redes, WhatsApp, dirección)", "Íconos del pie de página + botones “Consultar” en portada, ficha de producto y checkout"],
  ["Activar/desactivar Mercado Pago", "Habilita esa opción en el checkout (necesita además credenciales reales del lado del desarrollador)"],
  ["Activar Transferencia + datos bancarios", "Habilita esa opción; define qué datos y mensaje ve la clienta al elegirla"],
  ["Activar “Chatea con nosotros”", "Habilita esa opción; arma el mensaje de WhatsApp automáticamente"],
  ["Popup de bienvenida (on/off, textos, pasos)", "Modal que se muestra una vez por visita"],
  ["Promociones por monto", "Tarjetas informativas en “Beneficios por tu compra” — no aplican descuento solas"],
  ["Cambiar estado de un pedido", "La clienta lo ve reflejado en su pedido o en “Mi cuenta”"],
  ["Verificar pago por transferencia", "Cambia el estado visible del pago + dispara email automático"],
  ["Responder en el chat de un pedido", "Le llega email con link privado; solo puede responder si tiene cuenta y está logueada"],
];

const GAPS = [
  ["Costo de envío", "Es un valor fijo definido del lado del servidor ($5.000, gratis desde $80.000) — no hay pantalla en el panel para cambiarlo. El carrito le dice a la clienta “precios sin envío, se coordina por WhatsApp”, aunque el sistema en los hechos ya suma ese envío fijo al total del pedido."],
  ["Categorías", "No hay un listado administrable; se arman solas a partir de lo que escribas en cada producto."],
  ["Cupones o descuentos automáticos", "No existen. Las “Promociones por monto” son solo carteles informativos, nunca aplican un descuento en el carrito."],
  ["“Precio por transferencia” y cuotas por producto", "Se ven en el diseño de algunas fichas viejas, pero no hay forma de cargarlos desde el panel actual. Lo real y configurable es el mensaje + datos bancarios de Transferencia a nivel checkout general."],
  ["Roles y permisos", "No hay forma de crear un segundo usuario admin con acceso limitado — es un único login con acceso total, o nada."],
  ["Alta de un usuario admin nuevo", "Requiere carga manual en la base de datos por parte de tu desarrollador; no hay pantalla para hacerlo desde la web."],
  ["Credenciales de Mercado Pago y del email", "Se configuran del lado del servidor. Si no están cargadas, los emails automáticos no se envían de verdad y Mercado Pago no procesa pagos reales."],
];

export default function AdminManual() {
  return (
    <Stack spacing={2} sx={{ maxWidth: 920 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Manual del panel
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Instructivo de uso: qué configura cada pantalla del panel y qué cambia, exactamente, del lado de la
          clienta.
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap">
          <Chip size="small" icon={<Box component="span" sx={{ pl: 0.5 }} />} label={<><b>Panel</b> — lo que hacés vos</>} sx={{ bgcolor: "rgba(29,22,18,0.08)" }} />
          <Chip size="small" label={<><b>Clienta ve</b> — lo que cambia en el sitio público</>} sx={{ bgcolor: "rgba(200,164,93,0.22)" }} />
        </Stack>
      </Box>

      <GroupTitle eyebrow="Se hace una vez, al arrancar">Configuración inicial</GroupTitle>

      <SectionAccordion icon={<VpnKeyOutlinedIcon color="primary" />} title="Antes de entrar" defaultExpanded>
        <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
          <AlertTitle sx={{ fontWeight: 900 }}>No hay pantalla para crear el primer admin</AlertTitle>
          El usuario y la contraseña de administrador los tiene que cargar quien te da soporte técnico, directo
          en la base de datos. No existe un botón de alta dentro del panel. Tampoco hay recuperación de
          contraseña para admin (a diferencia de tus clientas, que sí tienen "olvidé mi contraseña") — guardá
          esas credenciales en un lugar seguro.
        </Alert>
        <Typography variant="body2" sx={{ mb: 1.5 }}>
          El login de <code>/login</code> es exclusivo de administración — no es la misma pantalla donde entran
          tus clientas a "Mi cuenta" (<code>/account</code>). Un usuario admin no sirve para comprar, y una cuenta
          de clienta no sirve para entrar al panel.
        </Typography>
        <Typography variant="body2">
          Hoy no hay roles ni permisos: quien entra puede ver y cambiar todo (productos, precios, pedidos, datos
          bancarios). Si más de una persona administra la tienda, comparten el mismo usuario.
        </Typography>
      </SectionAccordion>

      <SectionAccordion icon={<Inventory2Icon color="primary" />} route="/admin/products" title="Productos y catálogo" dek="El corazón del panel.">
        <FieldList
          items={[
            ["Nombre", "el título del producto tal cual lo va a leer la clienta."],
            ["Categoría", "texto libre — no hay una lista fija para elegir (ver aviso abajo)."],
            ["Etiquetas (tags)", "texto libre separado por comas. Tres tienen efecto especial: Oferta, Destacado, Nuevo."],
            ["Precio base", "solo se usa si el producto no tiene variantes cargadas."],
            ["Imagen principal / alternativa", "la alternativa se muestra al pasar el mouse por encima (efecto hover)."],
            ["Variantes", "color, talle, precio y stock propios de cada una."],
          ]}
        />
        <Typography variant="body2" sx={{ mb: 2 }}>
          El precio que se muestra en el catálogo y en la portada es siempre <strong>el más bajo entre todas las
          variantes</strong> cargadas, no un promedio ni el de la primera.
        </Typography>

        <Typography sx={{ fontWeight: 800, mb: 1 }}>Las tres etiquetas que mueven productos en la portada</Typography>
        <CauseEffect cause={<>Le agregás el tag <code>Oferta</code> a un producto</>} effect="Aparece en la sección “Ofertas” de la portada" />
        <CauseEffect cause={<>Le agregás el tag <code>Destacado</code></>} effect="Aparece en la sección “Destacados”" />
        <CauseEffect cause={<>Le agregás el tag <code>Nuevo</code></>} effect="Aparece en “Nuevos ingresos”" />
        <Typography variant="body2" sx={{ mb: 2 }}>
          Cada sección muestra hasta 6 productos y solo aparece si hay al menos uno con esa etiqueta.
        </Typography>

        <Typography sx={{ fontWeight: 800, mb: 1 }}>Stock</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Si la suma de stock de todas las variantes llega a 0, el producto se marca "Sin stock" en toda la
          tienda y el botón "Agregar al carrito" se deshabilita automáticamente — vuelve a estar disponible apenas
          le cargás stock de nuevo, sin que tengas que hacer nada más.
        </Typography>

        <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
          <AlertTitle sx={{ fontWeight: 900 }}>El botón "Restaurar seed" borra todo el catálogo</AlertTitle>
          Reemplaza todos tus productos actuales por el catálogo de ejemplo original. Es para pruebas, no para uso
          normal.
        </Alert>

        <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
          <AlertTitle sx={{ fontWeight: 900 }}>"Precio por transferencia" y cuotas: no se pueden cargar</AlertTitle>
          El diseño del sitio tiene espacio para mostrarlos en la ficha de producto, pero el formulario de carga
          del panel no tiene campos para eso. Ningún producto creado o editado desde el panel va a poder
          mostrarlos. Si lo necesitás, es un pedido de desarrollo.
        </Alert>

        <Alert severity="info" variant="outlined">
          <AlertTitle sx={{ fontWeight: 900 }}>Categorías: son texto libre</AlertTitle>
          El filtro que ve la clienta se arma solo a partir de lo que escribas en "Categoría". Escribilo siempre
          igual (mismas mayúsculas): "Árabes" y "arabes" el sistema los trata como categorías distintas.
        </Alert>
      </SectionAccordion>

      <SectionAccordion icon={<PhotoLibraryOutlinedIcon color="primary" />} route="/admin/home-images" title="Portada (Hero)" dek='En el menú aparece como "Hero".'>
        <FieldList
          items={[
            ["Cantidad", "hasta 4 imágenes."],
            ["Formato / peso", "JPG, PNG o WEBP, máximo 8 MB cada una."],
            ["Por imagen", "título interno, visible/oculta, orden (flechas)."],
          ]}
        />
        <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
          Después de reordenar o mostrar/ocultar imágenes hay que apretar <strong>"Guardar orden"</strong>. Si
          cerrás la pantalla sin guardar, el cambio no queda.
        </Alert>
        <CauseEffect
          cause="Subís hasta 4 fotos y las marcás “Visible”, en el orden que quieras"
          effect="Esas fotos aparecen en una grilla 2×2 junto al texto principal de la portada"
        />
        <Typography variant="body2">
          Si no hay ninguna imagen cargada (o están todas ocultas), la portada muestra una imagen genérica de
          relleno — nunca queda un espacio vacío.
        </Typography>
      </SectionAccordion>

      <SectionAccordion icon={<SettingsIcon color="primary" />} route="/admin/settings" title="Configuración general" dek="Datos de tienda, música, contacto, formas de pago, popup y promociones.">
        <Typography sx={{ fontWeight: 800, mb: 1 }}>Datos de la tienda</Typography>
        <CauseEffect cause='Cambiás el "Nombre de la tienda"' effect="Se actualiza en el logo, la portada y el pie de página" />
        <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
          Si el nombre que escribís contiene la palabra "storefront" o "karolin" (residuo de una versión anterior
          del sitio), el sistema lo descarta y vuelve a un nombre por defecto. Evitá esas dos palabras.
        </Alert>

        <Typography sx={{ fontWeight: 800, mb: 1 }}>Música de fondo</Typography>
        <FieldList
          items={[
            ["Temas", "hasta 10 MP3, máximo 18 MB cada uno."],
            ["General", 'switch "Activada/Desactivada" y modo "En orden" o "Aleatoria".'],
          ]}
        />
        <CauseEffect
          cause='Activás la música y marcás algunos temas como "Activo"'
          effect="Reproductor flotante abajo a la derecha, en todas las páginas"
        />
        <Typography variant="body2" sx={{ mb: 2 }}>
          La clienta siempre puede apagarla manualmente; esa preferencia queda en su navegador, no afecta a otras
          visitas.
        </Typography>

        <Typography sx={{ fontWeight: 800, mb: 1 }}>Links de contacto</Typography>
        <CauseEffect
          cause="Cargás Instagram, Facebook, WhatsApp y dirección"
          effect="Íconos del pie de página (el que dejes vacío queda apagado)"
        />
        <CauseEffect
          cause="Cargás el número de WhatsApp"
          effect='Alimenta el botón "Consultar" en portada y ficha de producto, y la opción de pago "Chatea con nosotros"'
        />

        <Typography sx={{ fontWeight: 800, mb: 1 }}>Formas de pago</Typography>
        <Typography variant="body2" sx={{ mb: 1.5 }}>
          Cada método se activa o desactiva con su propio switch. Si lo apagás, esa opción no aparece como
          elegible en el checkout.
        </Typography>
        <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
          <AlertTitle sx={{ fontWeight: 900 }}>Mercado Pago: activar el switch no alcanza</AlertTitle>
          Habilita el botón en el checkout, pero para cobrar de verdad hace falta que tu desarrollador cargue las
          credenciales reales del lado del servidor. Sin eso, el botón existe pero el pago falla.
        </Alert>
        <CauseEffect
          cause="Activás Transferencia y cargás datos bancarios + un mensaje"
          effect="La clienta ve esos datos al elegirla y debe subir un comprobante para confirmar la compra (queda pendiente de verificación)"
        />
        <CauseEffect
          cause='Activás "Chatea con nosotros"'
          effect="Se le abre WhatsApp con un mensaje ya armado (productos, cantidades y total) al número de Contacto"
        />
        <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
          Una compra por "Chatea con nosotros" <strong>no genera un pedido en el sistema</strong> — no la vas a
          ver en Pedidos. El seguimiento de esa venta queda enteramente en WhatsApp.
        </Alert>

        <Typography sx={{ fontWeight: 800, mb: 1 }}>Popup de bienvenida</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Si está activo, se muestra una única vez por visita al sitio (vuelve a aparecer si la clienta cierra el
          navegador y entra de nuevo más tarde).
        </Typography>

        <Typography sx={{ fontWeight: 800, mb: 1 }}>Promociones por monto de compra</Typography>
        <CauseEffect
          cause='Cargás una promo activa, ej. "Envío gratis desde $80.000"'
          effect='Una tarjeta en "Beneficios por tu compra", en la portada'
        />
        <Alert severity="warning" variant="outlined">
          Es un cartel, no un descuento automático: el sistema no aplica ningún beneficio solo. Si prometés algo
          acá, el cumplimiento queda en tus manos.
        </Alert>
      </SectionAccordion>

      <GroupTitle eyebrow="Lo que vas a usar todo el tiempo">Operación diaria</GroupTitle>

      <SectionAccordion icon={<ReceiptLongIcon color="primary" />} route="/admin/orders" title="Pedidos">
        <Typography variant="body2" sx={{ mb: 2 }}>
          Estado del pedido: <strong>Creada → En preparación → Enviada → Entregada</strong>, o Cancelada. Se
          cambia con un clic y queda guardado al instante.
        </Typography>
        <CauseEffect
          cause='Apretás "Marcar pago verificado" en un pedido por transferencia'
          effect="La clienta recibe un email automático confirmando el pago, y el estado se actualiza en su pedido"
        />
        <Alert severity="info" variant="outlined" sx={{ my: 2 }}>
          El chat privado de cada pedido solo está disponible para compradoras con cuenta registrada y logueadas.
          Las que compraron como invitadas ven el estado pero no pueden responder por el chat — a esas hay que
          contactarlas por otro medio.
        </Alert>
        <Typography variant="body2">
          La clienta accede por el link privado que recibe por email, o desde "Mi cuenta" si compró con una
          cuenta creada. No hay notificación push: solo el email al verificar un pago o al recibir un mensaje
          nuevo tuyo.
        </Typography>
      </SectionAccordion>

      <SectionAccordion icon={<MailOutlineIcon color="primary" />} route="/admin/inbox" title="Bandeja">
        <Typography variant="body2">
          Lista los pedidos con mensajes de compradoras que todavía no respondiste — una herramienta de
          organización interna, sin ningún efecto sobre lo que ve la clienta.
        </Typography>
      </SectionAccordion>

      <SectionAccordion icon={<DashboardIcon color="primary" />} route="/admin" title="Resumen">
        <Typography variant="body2">
          Contadores de solo lectura: productos, variantes cargadas y etiquetas en uso. Un pantallazo rápido del
          catálogo — no se configura nada acá.
        </Typography>
      </SectionAccordion>

      <GroupTitle eyebrow="Para consultar rápido">Referencia</GroupTitle>

      <SectionAccordion icon={<ListAltIcon color="primary" />} title="Causa → efecto, de un vistazo" defaultExpanded={false}>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 900 }}>Configurás en el Panel</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Efecto para la Clienta</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {REFERENCE_ROWS.map(([cause, effect]) => (
                <TableRow key={cause}>
                  <TableCell sx={{ fontWeight: 700 }}>{cause}</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{effect}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </SectionAccordion>

      <SectionAccordion
        icon={<BlockOutlinedIcon color="primary" />}
        title="Lo que todavía no se puede configurar"
        dek="Para no perder tiempo buscando un botón que no existe."
        defaultExpanded={false}
      >
        <Stack spacing={1.5}>
          {GAPS.map(([title, desc]) => (
            <Paper key={title} variant="outlined" sx={{ p: 1.75, borderLeft: "3px solid", borderLeftColor: "secondary.main" }}>
              <Typography sx={{ fontWeight: 800, mb: 0.3 }}>{title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {desc}
              </Typography>
            </Paper>
          ))}
        </Stack>
      </SectionAccordion>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2, mb: 4 }}>
        Guía elaborada a partir de una revisión del código y la configuración del sitio (agosto de 2026). Si algo
        cambió desde entonces, valen más los botones que ves en pantalla que este manual.
      </Typography>
    </Stack>
  );
}
