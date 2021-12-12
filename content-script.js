// Globals.
let options;
let apiKey;
let debugging;
let darkMode;

let updateRate = 1000;  // Update rate in milliseconds.
let firstCall = true;
let ratioBarBackground;
let ratioBar;
let lastVideoData = {
  id: undefined,
  likes: NaN,
  dislikes: NaN,
};

// Constants.
const dislikeIconTag = 'yt-icon';
const dislikeSVGPath = 'M17,4h-1H6.57C5.5,4,4.59,4.67,4.38,5.61l-1.34,6C2.77,12.85,3.82,14,5.23,14h4.23l-1.52,4.94C7.62,19.97,8.46,21,9.62,21 c0.58,0,1.14-0.24,1.52-0.65L17,14h4V4H17z M10.4,19.67C10.21,19.88,9.92,20,9.62,20c-0.26,0-0.5-0.11-0.63-0.3 c-0.07-0.1-0.15-0.26-0.09-0.47l1.52-4.94l0.4-1.29H9.46H5.23c-0.41,0-0.8-0.17-1.03-0.46c-0.12-0.15-0.25-0.4-0.18-0.72l1.34-6 C5.46,5.35,5.97,5,6.57,5H16v8.61L10.4,19.67z M20,13h-3V5h3V13z';
const dislikeSVGPathFilled = 'M18,4h3v10h-3V4z M5.23,14h4.23l-1.52,4.94C7.62,19.97,8.46,21,9.62,21c0.58,0,1.14-0.24,1.52-0.65L17,14V4H6.57 C5.5,4,4.59,4.67,4.38,5.61l-1.34,6C2.77,12.85,3.82,14,5.23,14z';

const getDislikeIcon = () => {
  let results = Array.from(document.getElementsByTagName(dislikeIconTag)).filter(element => element.innerHTML.includes(dislikeSVGPath));
  if(results.length === 0) {
    return Array.from(document.getElementsByTagName(dislikeIconTag)).filter(element => element.innerHTML.includes(dislikeSVGPathFilled))[0];
  }
  return results[0];
}
const getDislikeTextField = () => getDislikeIcon().parentElement.parentElement.parentElement.children[1];
const getMenuContainer = () => getDislikeIcon().parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
const getDislikeContainer = () => getDislikeIcon().parentElement.parentElement.parentElement.parentElement;
const getLikeContainer = () => getDislikeContainer().parentElement.children[0];
const debug = msg => { if(debugging) console.log(msg) };

// Set up ratio bar.
ratioBarBackground = document.createElement('div');
ratioBarBackground.style.height = '2px';
ratioBarBackground.style.bottom = '-8px';
ratioBarBackground.style.position = 'absolute';

ratioBar = document.createElement('div');
ratioBar.style.height = '100%';

ratioBarBackground.append(ratioBar);

// Updates the likes/dislikes count and ratio bar.
const updateLikesAndDislikes = (likes, dislikes) => {
  // Update color theme first.
  ratioBarBackground.style.backgroundColor = darkMode ? '#717171' : '#c5c5c5';
  ratioBar.style.backgroundColor = darkMode ? '#ffffff' : '#030303';

  // Update dislikes count.
  if(isNaN(likes) || isNaN(dislikes)){
    getDislikeTextField().innerHTML = 'dislike';
    ratioBarBackground.style.display = 'none';
    return;
  };

  let dislikesText;
  if(dislikes < 1000) {
    dislikesText = ''+dislikes;
  } else if(dislikes < 1000000) {
    dislikesText = `${Math.trunc(dislikes/100)/10}k`;
  } else if(dislikes < 1000000000) {
    dislikesText = `${Math.trunc(dislikes/100000)/10}m`;
  } else {
    dislikesText = `${Math.trunc(dislikes/1000000)}m`;
  }
  getDislikeTextField().innerHTML = dislikesText;

  // Update ratio.
  let gapRaw = window.getComputedStyle(getDislikeContainer()).marginLeft;
  let gap = Number(gapRaw.substring(0, gapRaw.length - 2));

  ratioBarBackground.style.width = `${getLikeContainer().clientWidth + getDislikeContainer().clientWidth + gap}px`;
  ratioBar.style.width = `${Math.trunc(100*likes/(likes + dislikes))}%`;
  ratioBarBackground.style.display = 'block';

  if(firstCall) {
    firstCall = false;
    getMenuContainer().append(ratioBarBackground);
  }
}

// Update loop to check if page has changed.
const update = () => setTimeout(async () => {
  debug('Updating...');

  // Wait for options to load.
  if(!options) {
    options = globalThis.OPTIONS;
    if(!options) {
      update();
      return;
    }
    apiKey = options.APIKEY;
    debugging = options.DEBUG;
  }

  // Load color theme.
  chrome.storage.sync.get('theme', ({ theme }) => {
    darkMode = (theme === 'dark');
  });

  // Wait for page to load.
  try {
    getDislikeIcon();
    getDislikeTextField();
    getMenuContainer();
    getDislikeContainer();
    getLikeContainer();
  } catch(_) {
    debug('Like/dislike container not found, waiting...');
    update();
    return;
  }

  // Get the video ID.
  let params = decodeURI(window.location.search)
    .replace('?', '')
    .split('&')
    .map((param) => param.split('='))
    .reduce((values, [key, value]) => {
      values[key] = value;
      return values;
    }, {});

  // Update the like/dislikes.
  updateLikesAndDislikes(lastVideoData.likes, lastVideoData.dislikes);
  
  // Only make an API request if the video has changed.
  if(params.v === undefined || lastVideoData.id === params.v) {
    update();
    return;
  }

  // Get new video information.
  debug('New video detected, calling API');
  let status;
  let response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${params.v}&key=${apiKey}`).then(response => {
    status = response.status;
    return response.json();
  });
  if(status === 403) {
    debug('Invalid API key');
    getDislikeTextField().innerHTML = 'Invalid API key. Check `options.js`';
    return;
  }
  lastVideoData = {
    id: params.v,
    likes: Number(response.items[0].statistics.likeCount),
    dislikes: Number(response.items[0].statistics.dislikeCount),
  };

  update();
}, updateRate);

update();
