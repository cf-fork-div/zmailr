const theme = localStorage.getItem('theme') || 'dark';
document.documentElement.classList.add(theme);
