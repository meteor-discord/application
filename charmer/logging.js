const { icon } = require('#utils/markdown');
const { USER_AGENT } = require('#utils/user-agent');
const superagent = require('superagent');

const MAINTOWER_BASE_URL = process.env.MAINTOWER_URL;

let maintowerClient = '1fepg2wdk-prod';
if (process.env.MAINTOWER_OVERRIDE) maintowerClient = process.env.MAINTOWER_OVERRIDE;

/**
 * This is a list of error messages that will show up at least
 * 50 times a day and cannot be reasonably avoided.
 */
const BLOCKED_LOGS = ['Unknown Message', 'Unknown interaction', 'Message was blocked by AutoMod'];

module.exports.formatErrorMessage = (sev = 0, code, content) => {
  return `${icon('webhook_exclaim_' + parseInt(sev))} \`[${Date.now()}]\` @ \`[${process.env.HOSTNAME || 'meteor'}]\` **\` ${code}  \`** | ${content}`;
};

module.exports.maintower = async function (packages, type) {
  if (!MAINTOWER_BASE_URL) {
    console.warn('No maintower url configured.');
    return;
  }
  try {
    let res = await superagent
      .post(MAINTOWER_BASE_URL + 'invoke')
      .set({
        Authorization: process.env.API_KEY,
        'x-meteor-client': USER_AGENT,
      })
      .query({
        client: maintowerClient,
        type: type,
      })
      .send(packages);
    if (res.body.status == 0) return res.body.id;
    throw res.body.message;
  } catch (e) {
    console.log(packages);
    console.error('Maintower request failed.');
  }
};

module.exports.basecamp = async function (log, content = '') {
  if (!MAINTOWER_BASE_URL) {
    console.warn('No maintower url configured.');
    return;
  }
  for (const l of BLOCKED_LOGS) {
    if (log.toString().includes(l)) return;
    if (content.toString().includes(l)) return;
  }
  try {
    let res = await superagent
      .post(MAINTOWER_BASE_URL + 'basecamp')
      .set({
        Authorization: process.env.API_KEY,
        'x-meteor-client': USER_AGENT,
      })
      .send({ log, content });
    return;
  } catch (e) {
    console.log(log);
    console.error('Basecamp request failed.');
  }
};
