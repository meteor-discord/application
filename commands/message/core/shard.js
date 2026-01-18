const { PERMISSION_GROUPS } = require('#constants');
const { format } = require('#utils/ansi');
const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { codeblock } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');

module.exports = {
  name: 'shard',
  metadata: {
    description: 'Details about the bots connection to this server.',
    description_short: 'Shard information',
    category: 'core',
    usage: 'shard',
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async context => {
    await acknowledge(context);

    return await editOrReply(
      context,
      createEmbed('default', context, {
        description: `${codeblock('ansi', [
          `Shard:   ${format(`${context.shardId + 1}/${context.manager.cluster.shardCount}`, 'magenta')}`,
          `Cluster: ${format(`${context.manager.clusterId + 1}/${context.manager.clusterCount}`, 'magenta')}`,
        ])}`,
      })
    );
  },
};
