import fetch from 'node-fetch';

const organizations = ["vacp2p", "waku-org"]
const specificRepos = ["status-im/nwaku", "status-im/js-waku", "status-im/go-waku"]
const username = process.env.GH_USER; // TODO: use only if rate limited
const password = process.env.GH_TOKEN; // TODO: use only if rate limited

// TODO: implement the body of this function.
// This will be executed once the full list of contributors is received
// Maybe we can generate an HTML file or markdown
function doSomething(contributors) {
    // sorting by contributions
    contributors = contributors.sort((a, b) => parseInt(b.contributions) - parseFloat(a.contributions))

    console.log("# Contributors")
    contributors.forEach(c => console.log(`<p>
    <a target="_blank">
        <img src="${c.avatar_url}" alt="${c.login}" style="width:40px; height: 40px"> ${c.login}
    </a>
</p>
`))
}




// ====================

const headers = username !== "" && password !== "" ?
    {
        'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`, 'binary').toString('base64')
    } : {}


async function getRepositories(organization) {
    const response = await fetch(`https://api.github.com/orgs/${organization}/repos`, { headers });
    const data = await response.json();
    if(data.message){
        throw data.message
    }
    return data.map(x => x.full_name)
}

async function getContributors(full_repo_name) {
    const response = await fetch(`https://api.github.com/repos/${full_repo_name}/contributors`, { headers });
    const data = await response.json();
    if(data.message){
        throw data.message
    }
    return data.filter(x => x.type == 'User').map(x => ({ login: x.login, avatar_url: x.avatar_url, url: x.url, contributions: x.contributions })).flat()
}

try {
    const orgRepositories = (await Promise.all(organizations.map(getRepositories))).flat();
    const repositories = orgRepositories.concat(specificRepos)
    const allContributors = (await Promise.all(repositories.map(getContributors))).flat();
    const contributorSummary = {}
    allContributors.forEach(c => {
        if(contributorSummary[c.login]){
            contributorSummary[c.login].contributions += c.contributions;
        } else {
            contributorSummary[c.login] = c;
        }
    });
    doSomething(Object.values(contributorSummary))
} catch (e) {
    console.error("ERROR", e);
}
