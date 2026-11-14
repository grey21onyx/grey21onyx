import { readFile, writeFile } from 'node:fs/promises';

const USER = process.env.GITHUB_USER || 'grey21onyx';
const TOKEN = process.env.GITHUB_TOKEN;
const API = 'https://api.github.com';

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'grey21onyx-neofetch-refresh'
};
if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

async function get(path) {
  const res = await fetch(API + path, { headers });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} for ${path}: ${await res.text()}`);
  }
  return res.json();
}

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

const user = await get(`/users/${USER}`);
const repos = await get(`/users/${USER}/repos?per_page=100&type=owner`);
const stars = repos.reduce((total, repo) => total + (repo.stargazers_count || 0), 0);
const followers = user.followers || 0;
const publicRepos = user.public_repos ?? repos.length;
const stats = `${plural(publicRepos, 'repo')} · ${plural(stars, 'star')} · ${plural(followers, 'follower')}`;

const target = /(<text\b[^>]*\bid="stat-value"[^>]*>)([^<]*)(<\/text>)/;

for (const file of ['assets/neofetch-desktop.svg', 'assets/neofetch-mobile.svg']) {
  const before = await readFile(file, 'utf8');
  if (!target.test(before)) {
    throw new Error(`Could not find id="stat-value" in ${file}`);
  }
  const after = before.replace(target, `$1${stats}$3`);
  if (after === before) {
    console.log(`${file}: unchanged (${stats})`);
  } else {
    await writeFile(file, after);
    console.log(`${file}: updated (${stats})`);
  }
}
