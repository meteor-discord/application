const BasePaginator = require('./BasePaginator');

module.exports = class InteractionPaginator extends BasePaginator {
  constructor(client, data) {
    super(client, data);
    this.waitingForPage = null;
  }
};
