import dotenv from "dotenv";

dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
});

export default {
  development: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    // Sesión de Postgres en hora de Colombia: las fechas "yyyy-mm-dd" de los
    // filtros (nómina, movimientos, cuadre) se comparan contra columnas
    // timestamptz -- con la sesión en UTC, lo hecho después de las 7 pm
    // caía en el día siguiente.
    pool: {
      afterCreate: (conn, done) => conn.query("SET TIME ZONE 'America/Bogota'", (err) => done(err, conn)),
    },
    migrations: {
      directory: "./migrations",
    },
  },
  production: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    },
    // Sesión de Postgres en hora de Colombia: las fechas "yyyy-mm-dd" de los
    // filtros (nómina, movimientos, cuadre) se comparan contra columnas
    // timestamptz -- con la sesión en UTC, lo hecho después de las 7 pm
    // caía en el día siguiente.
    pool: {
      afterCreate: (conn, done) => conn.query("SET TIME ZONE 'America/Bogota'", (err) => done(err, conn)),
    },
    migrations: {
      directory: "./migrations",
    },
  },
};
