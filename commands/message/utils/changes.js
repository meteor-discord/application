const { paginator } = require('#client');
const { OPEN_SOURCE_REPOSITORY_URL, PERMISSION_GROUPS } = require('#constants');

const { createEmbed, formatPaginationEmbeds, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { icon } = require('#utils/markdown');
const { editOrReply } = require('#utils/message');
const { USER_AGENT } = require('#utils/user-agent');

module.exports = {
  name: 'changes',
  label: 'page',
  aliases: ['commits', 'updates'],
  cooldown: 10,
  metadata: {
    description: 'Show recent commits from the repository.',
    description_short: 'Latest commits',
    examples: ['changes', 'changes 2'],
    category: 'utils',
    usage: 'changes [<page>]',
  },
  args: [{ name: 'page', type: 'number', default: 1, required: false, help: 'Page number' }],
  permissionsClient: [...PERMISSION_GROUPS.baseline],
  run: async (context, args) => {
    await acknowledge(context);

    try {
      const [owner, repo] = OPEN_SOURCE_REPOSITORY_URL.split('/').slice(-2);
      const pages = [];
      const maxPages = 5;

      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=10&page=${pageNum}`, {
          headers: { 'User-Agent': USER_AGENT, Accept: 'application/vnd.github+json' },
        });

        if (!res.ok) break;

        const commits = await res.json();
        if (!commits.length) break;

        const lines = commits.map(commit => {
          const sha = commit.sha.substring(0, 7);
          const message = commit.commit.message.split('\n')[0];
          const author = commit.commit.author.name || commit.author?.login || 'Unknown';
          return `${icon('link')} [\`${sha}\`](${commit.html_url}) — ${message} _(by ${author})_`;
        });

        pages.push(
          page(
            createEmbed('default', context, {
              title: 'Recent Commits',
              description: lines.join('\n\n'),
            })
          )
        );

        if (commits.length < 10) break;
      }

      if (!pages.length) return editOrReply(context, createEmbed('warning', context, 'No commits found.'));

      await paginator.createPaginator({
        context,
        pages: formatPaginationEmbeds(pages),
        startPage: Math.min((args.page || 1) - 1, pages.length - 1),
      });
    } catch (e) {
      console.log(e);
      return editOrReply(context, createEmbed('error', context, 'Unable to load commits.'));
    }
  },
};
