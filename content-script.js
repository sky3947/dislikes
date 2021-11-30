// Get personal API key or use a default key.
let apiKey = globalThis.APIKEY || 'AIzaSyC40Fd1dUcYIgt4l44XIVqtq_8SaS7RnVo';

let dislikeElement;
let firstCall = true;
let lastVideo;

// Waits for dislike container to load.
const awaitLoad = () => setTimeout(() => {
  try {
    dislikeElement = document.getElementById('menu-container').children[0].children[0].children[0].children[1].children[0].children[1];
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
      values[key] = value
      return values
    }, {});
  
  // Only make an API request if the video has changed.
  if(lastVideo === params.v) {
    return;
  }
  
  // Get number of dislikes and show it.
  lastVideo = params.v;
  let response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${params.v}&key=${apiKey}`)
    .then(response => response.json());
  let dislikes = Number(response.items[0].statistics.dislikeCount);
  if(dislikes < 1000) {
    dislikes = ''+dislikes
  } else if(dislikes < 1000000) {
    dislikes = `${Math.trunc(dislikes/1000)}k`
  } else if(dislikes < 1000000000) {
    dislikes = `${Math.trunc(dislikes/1000000)}m`
  }
  dislikeElement.innerHTML = dislikes;
};

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

update();