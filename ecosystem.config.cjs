module.exports = {
  apps: [{
    name: "openflow",
    script: "node_modules/.bin/next",
    args: "start",
    env: {
      PORT: 3000,
    },
  }],
};
