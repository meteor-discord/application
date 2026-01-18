const { PERMISSION_GROUPS } = require('#constants');
const { format } = require('#utils/ansi')
const { createEmbed } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { codeblock, icon } = require('#utils/markdown')
const { editOrReply } = require('#utils/message')

module.exports = {
  description: 'ping!',
  name: 'ping',
  metadata: {
    description: 'Displays information about the bots connection to discord.',
    description_short: 'Bot connection details',
    category: 'core',
    usage: 'ping'
  },
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context) => {
    await acknowledge(context);
    
    ping = await context.client.ping()
    editOrReply(context, createEmbed("default", context, {
      description: `${icon("latency")} **Pong!**\n` + codeblock("ansi", [`rest      ${format(`${ping.rest}ms`, "m")}`, `gateway   ${format(`${ping.gateway}ms`, "m")}`])
    }))
  },
};