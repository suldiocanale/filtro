// ==UserScript==
// @name        diocanale_filtro
// @namespace   Violentmonkey Scripts
// @grant       none
// @match       https://www.diochan.com/b/*
// @version     1.0
// @author      -
// @description 4/9/2020, 00:15:19
// ==/UserScript==


const config = {
  //se true, nasconde anche le risposte ai post filtrati
  hideReplies: false,
  //se false, non applica i filtri ad OP
  filterOp: true
};

/*
 * espressioni regolari, senza delimiters, una per linea, corrette, commentate (disattivate) con # iniziale
*/
const wordFilters = `
#esempio commento
dax
orecchie da
costumino da
frocianon
twink.*
BRA+P
pep.*
bozz.*
/pol/
paolini
ACCELERIAMO
carp.*
magikarp
eencel.*
GLUB
psyop
terapizzata
disfunzionale
smug.*
purr.*
noclip.*
brontolone
frocino
forum dei
piedi+ni+
giochi+ni+
trappo[f|m].*
pene femminile
sperg.*
s?batti i
facebook\.com
vice\.com
`;

const parse = lines => lines.split("\n").filter(line => line.trim().length > 0 && line[0] != "#").map(x => new RegExp(x, "i"));

const doesMatch = (regexes, text) => regexes.some(r => r.test(text));

const getFilter = (lines) => {
  const regexes = parse(lines);
  return (text) => doesMatch(regexes, text);
};

const getThreads = () => {
  return Array.from(document.querySelectorAll(".thread")).map(elem => ({
     threadNo: elem.id.replace("thread_", ""),
     opText: elem.querySelector("div.op > div.body").textContent,
     replies:  Array.from(elem.querySelectorAll("div.reply")).map(reply => ({
       text: reply.querySelector("div.body").textContent,
       postNo: reply.querySelectorAll("a.post_no")[1].textContent
    }))
  }));
};

/*diochan/main.js*/
const timestamp = () => Math.floor((new Date()).getTime() / 1000);

const savePostFilter = postFilter => {
  let DCPostFilter = JSON.parse(localStorage.getItem("postFilter"));
  
  if ("b" in DCPostFilter.postFilter === false) 
    DCPostFilter.postFilter.b = {};
  
  if ("b" in DCPostFilter.nextPurge === false) 
    DCPostFilter.nextPurge.b = {};
  
  //TODO extend + merge con valori presenti
  for (const [threadNo, hiddenPosts] of Object.entries(postFilter)) {
    DCPostFilter.postFilter.b[threadNo] = hiddenPosts;
    DCPostFilter.nextPurge.b[threadNo] = {timestamp: timestamp(), interval: 86400};
  }
  localStorage.setItem("postFilter", JSON.stringify(DCPostFilter));
  document.dispatchEvent(new Event("filter_page"));
};

window.addEventListener('DOMContentLoaded', (event) => {
  console.log("diochan filtro v0.1");
  const filter = getFilter(wordFilters);
  let postFilter = {};
  for (let thread of getThreads()) {
    if (config.filterOp && filter(thread.opText)) {
        postFilter[thread.threadNo] = [{post: thread.threadNo, hideReplies: config.hideReplies}];
        continue;
      }
    let filteredReplies = thread.replies.filter(post => filter(post.text)).map(reply => ({post: reply.postNo, hideReplies: config.hideReplies}));
    if (filteredReplies.length > 0)
      postFilter[thread.threadNo] = filteredReplies;
  }
  savePostFilter(postFilter);
});