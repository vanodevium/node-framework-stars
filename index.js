require("dotenv").config();
const fs = require("fs");
const request = require("undici").request;
const { format, parseISO } = require("date-fns");

const DATE_FORMAT = "LLLL dd, yyyy";
const now = new Date().toLocaleString("en", { timeZone: "UTC" });

const head = `# Top Node.js Web Frameworks
A list of popular GitHub projects related to Node.js web framework (ranked by stars automatically)\n
Please update **list.json** (via PR)

| Framework | Stars | Forks | Open Issues | Description | Last Update | License |
| --------- | ----- | ----- | ----------- | ----------- | ----------- | ------- |
`;
const tail = "*Last Update*: ";
const warning = "⚠️ No longer maintained ⚠️";

const accessToken = process.env.TOKEN;

const repos = [];

const options = {
  maxRedirections: 15,
  headers: {
    Authorization: `token ${accessToken}`,
    'User-Agent': "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36",
    accept: 'application/vnd.github.v3+json',
  },
};

const getJSON = async (url) => {
  return (await request(url, options)).body.json();
}

Promise.all(
  require("./list.json").map(async (framework) => {
    try {
      const repoURL = `https://api.github.com/repos/${framework}`;
      const repo = await getJSON(repoURL);
      const commit = await getJSON(`https://api.github.com/repos/${framework}/commits/${repo.default_branch}`);

      repo.lastCommitDate = commit.commit.committer.date;
      repos.push(repo);
    } catch (error) {
      console.error(error);
    }

    return Promise.resolve();
  })
).then(() => {
  if (repos.length === 0) {
    return;
  }

  let readme = "";
  readme += head;
  repos
    .sort((a, b) => a.stargazers_count - b.stargazers_count)
    .reverse()
    .map((repo) => {
      readme += `| [${repo.full_name}](${repo.html_url}) | ${
        repo.stargazers_count
      } | ${repo.forks} | ${repo.open_issues} | ${
        (repo.archived ? warning + " " : "") + repo.description
      } | ${format(parseISO(repo.lastCommitDate), DATE_FORMAT)} | ${
        repo.license?.name || ""
      } |\n`;
      return !0;
    });
  readme += `\n${tail}${format(new Date(now), "'UTC' HH:mm" + ", " + DATE_FORMAT)}`;
  fs.writeFileSync("README.MD", readme);
});
