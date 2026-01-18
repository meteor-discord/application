const superagent = require('superagent');

let TESTING_REVISION = '-1';

let TESTING_GROUPS = {};
let TESTING_ASSIGNMENTS = {};

function validateGroup(groups = [], featureId) {
  for (const g of groups) {
    if (TESTING_GROUPS[g] && TESTING_GROUPS[g].includes(featureId)) return true;
    if (TESTING_GROUPS[g] && TESTING_GROUPS[g].includes('*')) return true;
  }
  return false;
}

// Fetches the testing configuration from the cdn
async function getTestConfig() {
  if (!process.env.TESTING_CONFIG_URL) throw 'Missing TESTING_CONFIG_URL in environment';

  try {
    let config = await superagent.get(process.env.TESTING_CONFIG_URL).query({
      _t: Date.now(),
    });

    TESTING_GROUPS = config.body.feature_groups;
    TESTING_ASSIGNMENTS = config.body.feature_assignments;
    TESTING_REVISION = config.body.revision;

    console.log('Loaded test configs (revision ' + TESTING_REVISION + ')');

    return config.body;
  } catch (e) {
    throw 'Unable to retrieve test config.';
  }
}

async function hasFeature(context, feature) {
  if (!process.env.TESTING_CONFIG_URL) {
    console.warn('Test service config URL is missing, test features will be disabled.');
    return false;
  }

  // We need to load the test config first
  if (TESTING_REVISION == '-1') await getTestConfig();

  // Server
  if (context.guild && TESTING_ASSIGNMENTS.servers)
    if (validateGroup(TESTING_ASSIGNMENTS.servers[context.guild.id], feature)) return true;
  // Channel
  if (context.channel && TESTING_ASSIGNMENTS.channels)
    if (validateGroup(TESTING_ASSIGNMENTS.channels[context.channel.id], feature)) return true;
  // Category
  if (context.channel && context.channel.parent_id && TESTING_ASSIGNMENTS.categories)
    if (validateGroup(TESTING_ASSIGNMENTS.categories[context.channel.parent_id], feature)) return true;
  // User
  if (context.user && TESTING_ASSIGNMENTS.users)
    if (validateGroup(TESTING_ASSIGNMENTS.users[context.user.id], feature)) return true;

  return false;
}

module.exports = {
  getTestConfig,
  hasFeature,
};
