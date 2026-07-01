import app from "./app.js";
import path from "path";

const PORT = process.env.PORT || 3000;

process.on("uncaughtException", (err) => {
  console.error("Excepción no capturada:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Promesa rechazada sin manejar:", reason);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
