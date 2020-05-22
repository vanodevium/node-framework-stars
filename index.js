require('dotenv').config();
const fs = require('fs');
const got = require('got');
const luxon = require('luxon').DateTime;

const head = `# Top Node.js Web Frameworks
A list of popular GitHub projects related to Node.js web framework (ranked by stars automatically)\n
Please update **list.json** (via PR)

| Framework | Stars | Forks | Open Issues | Description | Last Commit | License |
| --------- | ----- | ----- | ----------- | ----------- | ----------- | ------- |
`;
const tail = '*Last Update*: ';
const warning = '⚠️ No longer maintained ⚠️';

const accessToken = process.env.TOKEN;

const repos = [];

Promise.all(
  require('./list.json').map(async framework => {
    try {
      const options = {
        headers: {
          Authorization: `token ${accessToken}`
        }
      };
      const repoURL = `https://api.github.com/repos/${framework}?access_token=${accessToken}`;
      const repo = JSON.parse((await got(Object.assign(options, {url: repoURL}))).body);

      const commitURL = `https://api.github.com/repos/${framework}/commits/${repo.default_branch}`;
      const commit = JSON.parse((await got(Object.assign(options, {url: commitURL}))).body);

      repo.lastCommitDate = commit.commit.committer.date;
      repos.push(repo);
    } catch (_) {

    }

    return Promise.resolve();
  })
).then(() => {
  if (repos.length === 0) {
    return;
  }

  let readme = '';
  readme += head;
  repos.sort((a, b) => a.stargazers_count - b.stargazers_count).reverse().map(repo => {
    readme += `| [${repo.full_name}](${repo.html_url}) | ${repo.stargazers_count} | ${repo.forks} | ${repo.open_issues} | ${(repo.archived ? warning + ' ' : '') + repo.description} | ${luxon.fromISO(repo.lastCommitDate).toLocaleString(luxon.DATE_FULL)} | ${repo.license ? repo.license.name : ''} |\n`;
    return !0;
  });
  const now = luxon.fromMillis(Number(new Date())).toUTC();
  readme += `\n${tail}${now.toLocaleString(luxon.TIME_24_SIMPLE)}, ${now.toLocaleString(luxon.DATE_FULL)}`;
  fs.writeFileSync('README.MD', readme);
});
