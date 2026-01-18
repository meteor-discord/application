const { ClusterManager } = require('detritus-client');
const superagent = require('superagent')

// Configure environment
require('dotenv').config();

const { basecamp, formatErrorMessage } = require('#logging');

const time = Date.now();
const token = process.env.token;

// Get the correct path for each environment type
let client = "./labscore/client.js"
if(process.env.PATH_OVERRIDE) client = process.env.PATH_OVERRIDE;

const SHARDS = process.env.SHARDS || 2;
const SHARDS_PER_CLUSTER = process.env.SHARDS_PER_CLUSTER_OVERRIDE || 2;

const manager = new ClusterManager(client, token, {
  shardCount: SHARDS,
  shardsPerCluster: SHARDS_PER_CLUSTER,
});

(async () => {
  console.log(`[${process.env.HOSTNAME || "labscore"}] launching bot`)

  // Logging
  manager.on("clusterProcess", ({ clusterProcess }) => {
    clusterProcess.on('close', ({code, signal}) => {
      basecamp(formatErrorMessage(4, "CLUSTER_CLOSED", `Cluster ${clusterProcess.clusterId} closed with code \`${code}\` and signal \`${signal}\``));
    });
    clusterProcess.on('warn', async ({error}) => {
      await basecamp(formatErrorMessage(2, "CLUSTER_WARNING", `Cluster ${clusterProcess.clusterId} issued warning\n\`\`\`js\n${error}\`\`\``));
    });
  })
  
  await manager.run();
  console.log(`[${process.env.HOSTNAME || "labscore"}] bot ready (${Date.now() - time}ms)`)
  console.log(`[${process.env.HOSTNAME || "labscore"}] manager running shards ${manager.shardStart}-${manager.shardEnd} (${manager.shardCount})`);
})();