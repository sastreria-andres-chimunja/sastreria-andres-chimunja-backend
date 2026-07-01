export default {
  apps: [
    {
      name: "sastreria-backend",
      script: "src/server.js",
      env_production: {
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "300M",
    },
  ],
};
