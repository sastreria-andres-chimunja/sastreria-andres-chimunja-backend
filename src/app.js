import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import clienteRoutes from "./routes/cliente.routes.js";
import medidasRoutes from "./routes/medida.route.js";
import imagenesRoutes from "./routes/imagenes.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(cors({ origin: "*" }));
// ── Middlewares ──
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Archivos estáticos──
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
// CORS

// rutas
app.use("/clientes", clienteRoutes);
app.use("/medidas", medidasRoutes);
app.use("/imagenes", imagenesRoutes);
export default app;
