module.exports = {
  apps: [
    {
      name: 'paydasdataroom',
      cwd: '/var/paydasdataroom/planka/server',
      script: 'app.js',
      args: '--prod',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '600M',
      autorestart: true,
      restart_delay: 5000,
      out_file: '/var/log/paydasdataroom/out.log',
      error_file: '/var/log/paydasdataroom/error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
