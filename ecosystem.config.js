module.exports = {
  apps: [{
    name: 'task-manager',
    script: 'node_modules/.bin/next',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }],
}
