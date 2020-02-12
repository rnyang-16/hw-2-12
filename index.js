const inquirer = require("inquirer");
const fs = require("fs");
const util = require("util");
const axios = require("axios");
var pdf = require('html-pdf');

const generateHTML = require("./generateHTML.js");

const writeFileAsync = util.promisify(fs.writeFile);

function promptUsername() {
  return inquirer
    .prompt([
      {
        type: "input",
        message: "What is your user name?",
        name: "username"
      }
    ]);
}

function promptFavColor() {
  return inquirer
    .prompt([
      {
        type: "input",
        message: "What is your favorite color?",
        name: "color"
      }
    ]);
}


function searchGithubUser(username, cb) {
  // console.log(username);
  axios
  .get(`https://api.github.com/users/${username}`)
  .then(function(user_info) {
    axios.get(`https://api.github.com/users/${username}/repos?per_page=100`)
    .then(function(repo_info) {
      cb(user_info, repo_info);
    });
  });

}

function count_repo_stars(repo_info) {
  var count = 0;
  var i;
  // console.log(repo_info.length)
  for(i=0; i<repo_info.length; i++) {
    // console.log(repo_info[i]);
    count += repo_info[i].stargazers_count;
  }
  return count;
}

async function renderPdf(user_info, repo_info) {

  user_info = user_info.data;
  repo_info = repo_info.data;

  repo_stars = count_repo_stars(repo_info);
  // console.log("repo_stars:" + repo_stars);

  const answers = await promptFavColor();
  console.log(answers.color);

  // generate html of profile
  const html = generateHTML.generateHTML({
    "color": answers.color,
    "user_info": user_info,
    "repo_info": repo_info,
    "repo_stars": repo_stars
  });

  await writeFileAsync("profile.html", html);

  var options = { format: 'Letter' };

  // convert pdf from html
  pdf.create(html, options).toFile('./profile.pdf', function(err, res) {
    if (err) return console.log(err);
    console.log(res); // { filename: '/app/profile.pdf' }
  });

}

async function init() {
  console.log("hi")
  try {
    // prompt to user
    const answers = await promptUsername();
    console.log(answers.username);

    // get info from github
    searchGithubUser(answers.username, renderPdf);

    
    // console.log("Successfully wrote to profile.pdf");
  } catch(err) {
    console.log(err);
  }
}

init();