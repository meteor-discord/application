// Some endpoints (e.g. rextester) are stricter about accepting bot-looking user agents.
const USER_AGENT = process.env.METEOR_USER_AGENT || 'meteor/2.0';
const BROWSER_USER_AGENT =
  process.env.METEOR_BROWSER_USER_AGENT ||
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/116.0';

module.exports = {
  USER_AGENT,
  BROWSER_USER_AGENT,
};
