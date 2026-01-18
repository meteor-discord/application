module.exports = {
  Paginator: require('./structures/Paginator'),
  get version() {
    return require('../package').version;
  },
};
