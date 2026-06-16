import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { generarClaveAleatoria } from "../src/services/auth.service.js";

dotenv.config();

const { default: db } = await import("../src/config/database.js");

const SALT_ROUNDS = 10;

async function crearAdmin() {
  try {
    console.log("Creando primer usuario administrador...\n");

    const rolAdmin = await db("rol").where({ nombre: "Admin" }).first();
    if (!rolAdmin) {
      console.error("❌ No existe el rol 'Admin'. Ejecute primero las migraciones.");
      process.exit(1);
    }

    const empleadoExistente = await db("empleado").where({ idEmpleado: 1 }).first();

    if (!empleadoExistente) {
      await db.raw(
        `INSERT INTO empleado ("idEmpleado", nombres, apellidos, telefono, direccion, "idRol")
         VALUES (1, 'Admin', 'Sistema', '000', 'Sastrería SAC', ?)
         ON CONFLICT ("idEmpleado") DO NOTHING`,
        [rolAdmin.idRol]
      );
      await db.raw(
        `SELECT setval(pg_get_serial_sequence('empleado', 'idEmpleado'), MAX("idEmpleado")) FROM empleado`
      );
      console.log(`✓ Empleado admin creado (idEmpleado: 1, rol: Admin)`);
    } else {
      await db("empleado").where({ idEmpleado: 1 }).update({ idRol: rolAdmin.idRol });
      console.log(`✓ Empleado con idEmpleado=1 ya existe — rol asignado a Admin`);
    }

    const claveTextoPlano = generarClaveAleatoria();
    const claveHash = await bcrypt.hash(claveTextoPlano, SALT_ROUNDS);

    const authExistente = await db("auth").where({ idEmpleado: 1 }).first();

    if (!authExistente) {
      await db("auth").insert({
        idEmpleado: 1,
        clave: claveHash,
        username: "admin",
        debeCambiarClave: true,
      });
      console.log('✓ Auth creado');
    } else {
      await db("auth").where({ idEmpleado: 1 }).update({
        username: "admin",
        clave: claveHash,
        debeCambiarClave: true,
      });
      console.log('✓ Auth actualizado');
    }

    console.log("\n✅ Usuario administrador listo:");
    console.log("   Username       : admin");
    console.log(`   Contraseña temp: ${claveTextoPlano}`);
    console.log("   (Debe cambiarla en el primer ingreso)");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

crearAdmin();
