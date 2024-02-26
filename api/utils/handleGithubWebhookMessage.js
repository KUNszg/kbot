const getFileNames = require('./getFileNames');

const handleGithubWebhookMessage = async (services, event, repo, data) => {
  const { kb, redisClient } = services;

  if (event === 'push') {
    await kb.sqlClient.query(
      `    
            UPDATE stats
            SET date=?, sha=?
            WHERE type="ping"`,
      [
        data.head_commit?.timestamp ?? new Date().toISOString().slice(0, 19).replace('T', ' '),
        data.head_commit.id.slice(0, 7),
      ]
    );

    const fileNames = getFileNames(data.head_commit.modified);

    if (data.commits.length > 1) {
      return `[github webhook] ⬆  New push ${data.head_commit.id.slice(0, 7)} with
        ${data.commits.length} commits in ksyncbot's repository #⃣  "${
        data.head_commit.message
      }" 
        🔄 changes in: ${fileNames}, `;
    }

    return `[github webhook] ⬆  New commit ${data.head_commit.id.slice(
      0,
      7
    )} in ksyncbot's repository 
    #⃣  "${data.head_commit.message}" 🔄 changes in: ${fileNames}`;
  }

  if (event === 'create') {
    if (data.ref_type === 'branch') {
      return `[github webhook] New branch "${data.ref}" has been created in ksyncbot's repository`;
    }

    if (data.ref_type === 'tag') {
      return `[github webhook] New tag "${data.ref}" has been created in ksyncbot's repository`;
    }
  }

  if (event === 'delete') {
    if (data.ref_type === 'branch') {
      return `[github webhook] Branch "${data.ref}" has been deleted in ksyncbot's repository`;
    }

    if (data.ref_type === 'tag') {
      return `[github webhook] Tag "${data.ref}" has been deleted in ksyncbot's repository`;
    }
  }

  if (event === 'commit_comment') {
    if (data.action === 'created') {
      const trim =
        data.comment.body.length > 350
          ? data.comment.body.substring(0, 350)
          : data.comment.body;

      return `[github webhook] A commit comment has been created at line ${data.comment.line} 
        ▶ "${trim}" ${data.comment.url}`;
    }
  }

  if (event === 'star' && data.action === 'created') {
    const key = 'star-' + data.sender.login;

    const responseRateLimit = await redisClient.get(`kb:api:github-webhook:${key}`);

    if (!responseRateLimit) {
      await redisClient.set(`kb:api:github-webhook:${key}`, true);

      return `[github webhook] ${data.sender.login} just starred the ksyncbot repository for the total of 
        ${data.repository.stargazers_count} stars PogChamp <3 https://github.com/KUNszg/kbot`;
    }
  }

  if (event === 'repository_vulnerability_alert') {
    if (data.action === 'create') {
      return `[github vulnerability alert]  monkaS package ${data.alert.affected_package_name} in
        https://github.com/KUNszg/kbot has been spotted by ${data.sender.login} as ${data.alert.severity} 
        severity for version range ${data.alert.affected_range}`;
    }

    if (data.action === 'dismiss') {
      return `[github vulnerability alert] Vulnerability from ${data.alert.affected_package_name}
        package with ${data.alert.severity} severity has been dismissed in https://github.com/KUNszg/kbot`;
    }

    if (data.action === 'resolve') {
      return `[github vulnerability alert] Vulnerability from ${data.alert.affected_package_name}
        package with ${data.alert.severity} severity has been fixed and resolved to version ${data.alert.fixed_in} 
        in https://github.com/KUNszg/kbot`;
    }
  }

  if (event === 'fork') {
    return `[github webhook] ${data.sender.login} just forked the repo PogChamp ! https://github.com/KUNszg/kbot 
        ➡ https://github.com/${data.forkee.full_name}`;
  }

  if (event === 'pull_request') {
    if (data.action === 'opened') {
      return `[github webhook] ⬇ New pull request #${data.number} "${data.pull_request.title}" 📂  opened by
        ${data.pull_request.user.login}, mergeable state: 
        ${data.pull_request.base.mergeable_state} ${data.pull_request.html_url}`;
    }

    if (data.action === 'closed') {
      const isMerged = data.pull_request.base.merged ? 'without merging' : 'and merged';

      return `[github webhook] ✅ pull request #${
        data.number
      } has been closed ${isMerged} by ${data.sender.login}
        at ${data.pull_request.closed_at.toString().replace(/T|Z/g, ' ')}${
        data.pull_request.html_url
      }`;
    }
  }

  if (event === 'issues') {
    if (data.action === 'opened') {
      return `[github webhook] ✅New issue created #${data.issue.number} "${data.issue.title}" by 
        ${data.issue.user.login} ${data.issue.html_url}`;
    }

    if (data.action === 'closed') {
      return `[github webhook] ⛔ issue #${data.issue.number} has been closed by ${
        data.sender.login
      }
        at ${data.issue.closed_at.toString().replace(/T|Z/g, ' ')} ${data.issue.html_url}`;
    }

    if (data.action === 'deleted') {
      return `[github webhook] ❌ issue #${data.issue.number} has been deleted by ${
        data.sender.login
      }
        at ${new Date().toISOString().replace(/T|Z/g, ' ').split('.')[0]}`;
    }
  }

  return '';
};

module.exports = handleGithubWebhookMessage;
