import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import clienteRoutes from "./routes/cliente.routes.js";
import medidasRoutes from "./routes/medida.route.js";
import imagenesRoutes from "./routes/imagenes.routes.js";
import rolesRoutes from "./routes/rol.routes.js";
import empleadoRoutes from "./routes/empleado.routes.js";
import metodoPagoRoutes from "./routes/metodoPago.routes.js";
import tipoMovimientoRoutes from "./routes/tipoMovimiento.routes.js";
import categoriaMovimientoRoutes from "./routes/categoriaMovimiento.routes.js";
import movimientoRoutes from "./routes/movimiento.routes.js";
import nominaRoutes from "./routes/nomina.routes.js";
import authRoutes from "./routes/auth.routes.js";
import estadoRoutes from "./routes/estado.routes.js";
import pedidoRoutes from "./routes/pedido.routes.js";
import itemPedidoRoutes from "./routes/itemPedido.routes.js";
import whatsappRoutes from "./routes/whatsapp.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

const allowedOrigins = process.env.FRONTEND_ORIGIN
  ? process.env.FRONTEND_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:4200"];
app.use(
  cors({
    origin: allowedOrigins,
  })
);
// ── Middlewares ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Archivos estáticos──
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
// CORS

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// rutas
app.use("/clientes", clienteRoutes);
app.use("/medidas", medidasRoutes);
app.use("/imagenes", imagenesRoutes);
app.use("/roles", rolesRoutes);
app.use("/empleado", empleadoRoutes);
app.use("/metodoPago", metodoPagoRoutes);
app.use("/tipoMovimiento", tipoMovimientoRoutes);
app.use("/categoriaMovimiento", categoriaMovimientoRoutes);
app.use("/movimientos", movimientoRoutes);
app.use("/nomina", nominaRoutes);
app.use("/auth", authRoutes);
app.use("/estado", estadoRoutes);
app.use("/pedidos", pedidoRoutes);
app.use("/itemPedido", itemPedidoRoutes);
app.use("/whatsapp", whatsappRoutes);
export default app;
