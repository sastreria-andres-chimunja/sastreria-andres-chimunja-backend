/**
 * Limpia TODA la base de datos: elimina el schema public y lo recrea vacío.
 * Esto borra tablas, secuencias, índices y el registro de migraciones de Knex.
 * Ejecutar ANTES de `knex migrate:latest`.
 */
import dotenv from "dotenv";
dotenv.config();

const { default: db } = await import("../src/config/database.js");

try {
  console.log("🗑️  Eliminando schema public...");
  await db.raw("DROP SCHEMA public CASCADE");
  await db.raw("CREATE SCHEMA public");
  await db.raw("GRANT ALL ON SCHEMA public TO public");
  console.log("✅ Schema recreado vacío. Listo para migrar.");
} catch (err) {
  console.error("❌ Error:", err.message);
  process.exit(1);
} finally {
  await db.destroy();
}
