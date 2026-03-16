import express from "express";
import clienteRoutes from "./routes/cliente.routes.js";
import medidasRoutes from "./routes/medida.route.js";
import imagenesRoutes from "./routes/imagenes.routes.js";

const app = express();

app.use(express.json());

app.use("/clientes", clienteRoutes);
app.use("/medidas", medidasRoutes);
app.use("/imagenes", imagenesRoutes);

export default app;
