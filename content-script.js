// Gets API key.
let apiKey;
const waitForApiKey = () => setTimeout(() => {
  apiKey = globalThis.APIKEY;
  if (!apiKey) {
    waitForApiKey();
  } else {
    update();
  }
}, 100)

let container;
let infoContainer;
let dislikeElement;
let ratioBar;
let ratioBarBackground;
let firstCall = true;
let lastVideo;

// Update each second to check if video has changed.
const update = () => setTimeout(() => {
  if(firstCall) {
    firstCall = false;
    awaitLoad();
  } else {
    run();
  }
  update();
}, 1000);

// Waits for dislike container to load.
const awaitLoad = () => setTimeout(() => {
  try {
    container = document.getElementById('menu-container');
    infoContainer = container.children[0].children[0].children[0];
    dislikeElement = infoContainer.children[1].children[0].children[1];
  } catch(_) {
    awaitLoad();
    return;
  }
  run();
}, 100);

// Send API request to YouTube data API and replace dislikes with the number.
const run = async () => {
  // Get the video ID.
  let params = decodeURI(window.location.search)
    .replace('?', '')
    .split('&')
    .map((param) => param.split('='))
    .reduce((values, [key, value]) => {
      values[key] = value;
      return values;
    }, {});
  
  // Only make an API request if the video has changed.
  if(lastVideo === params.v) {
    return;
  }
  
  // Get number of dislikes and show it.
  lastVideo = params.v;
  let response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${params.v}&key=${apiKey}`)
    .then(response => response.json());
  let dislikesCount = Number(response.items[0].statistics.dislikeCount);
  let likesCount = Number(response.items[0].statistics.likeCount);

  let dislikesText;
  if(dislikesCount < 1000) {
    dislikesText = ''+dislikesCount;
  } else if(dislikesCount < 1000000) {
    dislikesText = `${Math.trunc(dislikesCount/100)/10}k`;
  } else if(dislikesCount < 1000000000) {
    dislikesText = `${Math.trunc(dislikesCount/100000)/10}m`;
  } else {
    dislikesText = `${Math.trunc(dislikesCount/1000000)}m`;
  }
  dislikeElement.innerHTML = dislikesText;

  // Update the ratio bar.
  if (!ratioBarBackground) {
    ratioBarBackground = document.createElement('div');
    ratioBarBackground.style.height = '2px';
    ratioBarBackground.style.backgroundColor = '#717171';
    ratioBarBackground.style.bottom = '-8px';
    ratioBarBackground.style.position = 'absolute';
    ratioBarBackground.style.outline = '1px solid #303030';
    ratioBarBackground.style.width = `${infoContainer.children[0].clientWidth + infoContainer.children[1].clientWidth + 8}px`;

    ratioBar = document.createElement('div');
    ratioBar.style.height = '100%';
    ratioBar.style.backgroundColor = '#ffffff';
    ratioBar.style.width = `${Math.trunc(100*likesCount/(likesCount + dislikesCount))}%`;

    ratioBarBackground.append(ratioBar);
    container.append(ratioBarBackground);
  } else {
    ratioBarBackground.style.width = `${infoContainer.children[0].clientWidth + infoContainer.children[1].clientWidth + 8}px`;
    ratioBar.style.width = `${Math.trunc(100*likesCount/(likesCount + dislikesCount))}%`;
  }
};

waitForApiKey();