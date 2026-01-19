const { paginator } = require('#client');
const { OPEN_SOURCE_REPOSITORY_URL } = require('#constants');
const { createEmbed, formatPaginationEmbeds, page } = require('#utils/embed');
const { acknowledge } = require('#utils/interactions');
const { editOrReply } = require('#utils/message');
const { icon } = require('#utils/markdown');
const { USER_AGENT } = require('#utils/user-agent');

const PER_PAGE = 10;

function parseRepo(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    const owner = parts[0];
    const repo = parts[1];
    if (!owner || !repo) return null;
    return { owner, repo };
  } catch (e) {
    return null;
  }
}

async function fetchCommits(owner, repo, page) {
  const qs = new URLSearchParams({ per_page: PER_PAGE.toString(), page: page.toString() });
  const url = `https://api.github.com/repos/${owner}/${repo}/commits?${qs.toString()}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${text.substring(0, 300)}`);
  }

  return res.json();
}

module.exports = {
  name: 'updates',
  label: 'page',
  aliases: ['commits'],
  metadata: {
    description: 'Show recent commits from the repository.',
    description_short: 'Latest commits',
    examples: ['updates', 'updates 2'],
    category: 'dev',
    usage: 'updates [<page>]',
  },
  args: [{ name: 'page', type: 'number', default: 1, required: false, help: 'Page number' }],
  onBefore: context => context.user.isClientOwner,
  onCancel: () => {},
  run: async (context, args) => {
    await acknowledge(context);

    const repoInfo = parseRepo(OPEN_SOURCE_REPOSITORY_URL);
    if (!repoInfo) {
      return editOrReply(context, createEmbed('error', context, 'Repository URL is invalid.'));
    }

    const requestedPage = Math.max(1, args.page || 1);

    try {
      // Fetch multiple pages to build the paginator
      const maxPages = 5; // Limit to 5 pages (50 commits)
      const pages = [];

      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const commits = await fetchCommits(repoInfo.owner, repoInfo.repo, pageNum);

        if (!Array.isArray(commits) || commits.length === 0) {
          break;
        }

        const lines = commits.slice(0, PER_PAGE).map(commit => {
          const sha = commit.sha ? commit.sha.substring(0, 7) : 'unknown';
          const message = commit.commit?.message?.split('\n')[0] || 'No message';
          const author = commit.commit?.author?.name || commit.author?.login || 'Unknown';
          const url = commit.html_url || `${OPEN_SOURCE_REPOSITORY_URL}/commit/${commit.sha}`;
          const emoji = icon('link');
          return `${emoji} [\`${sha}\`](${url}) — ${message} _(by ${author})_`;
        });

        pages.push(
          page(
            createEmbed('default', context, {
              title: 'Recent Commits',
              description: lines.join('\n\n'),
            })
          )
        );

        // Stop if we got fewer commits than expected (last page)
        if (commits.length < PER_PAGE) {
          break;
        }
      }

      if (pages.length === 0) {
        return editOrReply(context, createEmbed('warning', context, 'No commits found.'));
      }

      await paginator.createPaginator({
        context,
        pages: formatPaginationEmbeds(pages),
        startPage: Math.min(requestedPage - 1, pages.length - 1),
      });
    } catch (e) {
      return editOrReply(context, createEmbed('error', context, `Failed to load commits. ${e.message}`));
    }
  },
};
