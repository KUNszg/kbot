const got = require('got');
const config = require('../../credentials/config');
const _ = require('lodash');

const GITHUB_TOKEN = process.env.githubAppAccessToken || config.githubAppAccessToken;

const ignoredFiles = [
  'package.json',
  'package-lock.json',
  '.github/',
  'README.md',
  'LICENSE.md'
];

const refreshEstimatedRepoLines = async kb => {
  const apiUrl = `https://api.github.com/repos/kunszg/kbot/git/trees/master?recursive=1`;

  const data = await got({
    url: apiUrl,
    headers: {
      Authorization: `${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json'
    },
    throwHttpErrors: false
  }).json();

  if (data.tree) {
    let totalSize = 0;

    data.tree.forEach(file => {
      if (file.type === 'blob' && !_.some(ignoredFiles, str => _.includes(str, file.path))) {
        totalSize += file.size;
      }
    });

    const averageBytesPerLine = 50;
    const estimatedLines = Math.ceil(totalSize / averageBytesPerLine);

    await kb.redisClient.set('kb:job-manager:estimatedRepoLines', estimatedLines, 1e8);
  } else {
    console.log('No data found for the repository tree.');

    await kb.redisClient.set('kb:job-manager:estimatedRepoLines', 0, 1e8);
  }
};

module.exports = refreshEstimatedRepoLines;
