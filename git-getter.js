const { Octokit } = require('@octokit/rest');
require('dotenv').config();

// Создаем экземпляр Octokit с вашим токеном доступа
const octokit = new Octokit({
  auth: process.env.GIT_API_KEY,
});

function getTree(tree, indent = '   ') {
  var index = 0;
  const keys = Object.keys(tree);
  var result="";
  for (key of keys)
  {
    const value = tree[key];
    let mark = "└──"
    let child_indent = "   "
    if (index < keys.length - 1){
      mark = "├──";
      child_indent = '│  '
    }

    if (value.type === 'dir') {
      result += (`${indent}${mark}${key}/\n`);
      result += getTree(value.children, `${indent}${child_indent}`);
    } else {
      result += (`${indent}${mark}${key}\n`);
    }
    
    index++;
  }
  return result;
}

async function getRepoInfo(owner, repo, count_files) {
  try {
    const response = await octokit.request("GET /repos/{owner}/{repo}", {
      owner,
      repo,
    });
    
    return `Репозиторий -> ${owner}/${repo}
            
Количество файлов -> ${count_files}
Размер репозитория -> ${response.data.size} байт`;

  } catch (error) {
    console.error(error);
    return "<не получается получить информацию>"
  }
}

function isTextFile(buffer) {
  for (let i = 0; i < buffer.length; i++) {
      const byte = buffer[i];
      // Проверяем, находится ли байт в пределах допустимого диапазона ASCII
      if (byte > 126) { 
          return false;
      }
  }
  
  return true;
}


async function getDirectoryStructure(owner, repo, count_files, path = '') {
  try {
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });
    var content = "";
    const tree = {};
    for (let item of response.data) {
      if (item.type === 'dir') {
        const struct = await getDirectoryStructure(owner, repo, count_files, item.path);
        content += struct.content;
        tree[item.name] = {
          type: 'dir',
          name: item.name,
          children: struct.tree,
        };
      } else {
        tree[item.name] = {
          type: 'file',
          name: item.name,
        };
        const fileResponse = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
          owner,
          repo,
          path: item.path,
        });
        if (fileResponse.status === 200 && fileResponse.data.content) {
          const buffer = Buffer.from(fileResponse.data.content, 'base64');
          if (isTextFile(buffer)){
            content += `=======================================
File: ${item.name}
=======================================
${buffer.toString()}
`
          }
        }
        count_files.count++;
      }
    }

    return {tree: tree, content: content};
  } catch (error) {
    console.error(`Ошибка при получении структуры каталога: ${error.message}`);
    throw error;
  }
}

module.exports.getAllStructure = async function(url_) {
  try {
    const url = url_.split('/');
    let owner = url[3]
    let repo = url[4];

    let title = `Directory structure:\n└──${owner}_${repo}/\n`
    count_files = {count: 0};
    const struct = await getDirectoryStructure(owner, repo, count_files);
    
    return {
      tree: title+getTree(struct.tree),
      content: struct.content,
      info: await getRepoInfo(owner, repo, count_files.count)
    };
  } catch (error) {
    console.error(error);
    return `ошибка чтения данных из ->\n${url_}`;
  }
}
