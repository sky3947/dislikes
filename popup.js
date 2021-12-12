let button = document.getElementById('changeTheme');
let localTheme;

// Updates button style.
const updateButton = (theme) => {
  localTheme = (theme === 'light' ? 'light' : 'dark');
  button.innerHTML = (localTheme === 'light' ? 'Light' : 'Dark');
  button.className = localTheme;
};

// Clicking the button alternates the color theme.
button.addEventListener('click', () => {
  localTheme = (localTheme === 'dark' ? 'light' : 'dark');
  let theme = localTheme;
  chrome.storage.sync.set({ theme });
  updateButton(theme);
});

// Acquire the color theme from storage.
chrome.storage.sync.get('theme', ({ theme }) => {
  localTheme = theme;
  updateButton(theme);
});
