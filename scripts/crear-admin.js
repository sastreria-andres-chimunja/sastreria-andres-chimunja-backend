import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

// Dynamic import to allow dotenv to load first
const { default: db } = await import("../src/config/database.js");

const SALT_ROUNDS = 10;

async function crearAdmin() {
  try {
    console.log("Creando primer usuario administrador...\n");

    // 1. Ensure an empleado with idEmpleado=1 exists
    const empleadoExistente = await db("empleado").where({ idEmpleado: 1 }).first();

    if (!empleadoExistente) {
      await db.raw(
        `INSERT INTO empleado ("idEmpleado", nombres, apellidos, telefono, direccion)
         VALUES (1, 'Admin', 'Sistema', '000', 'Sastrería SAC')
         ON CONFLICT ("idEmpleado") DO NOTHING`
      );
      // Resync the sequence so future inserts don't collide
      await db.raw(
        `SELECT setval(pg_get_serial_sequence('empleado', 'idEmpleado'), MAX("idEmpleado")) FROM empleado`
      );
      console.log('✓ Empleado admin creado (idEmpleado: 1, nombres: "Admin Sistema")');
    } else {
      console.log(
        `✓ Empleado con idEmpleado=1 ya existe: ${empleadoExistente.nombres} ${empleadoExistente.apellidos}`
      );
    }

    // 2. Create or update auth for idEmpleado=1
    const claveHash = await bcrypt.hash("123456", SALT_ROUNDS);
    const authExistente = await db("auth").where({ idEmpleado: 1 }).first();

    if (!authExistente) {
      await db("auth").insert({ idEmpleado: 1, clave: claveHash, username: "admin" });
      console.log('✓ Auth creado (username: "admin")');
    } else {
      await db("auth")
        .where({ idEmpleado: 1 })
        .update({ username: "admin", clave: claveHash });
      console.log('✓ Auth actualizado (username: "admin")');
    }

    console.log("\n✅ Usuario administrador listo para usar:");
    console.log("   Username : admin");
    console.log("   Contraseña: 123456");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

crearAdmin();
