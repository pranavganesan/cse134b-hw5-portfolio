// Global site data: defined once, consumed by every template.
// Update `url` after the first Netlify deploy (used by sitemap.xml).
module.exports = {
  title: "Pranav Ganesan | Portfolio",
  author: "Pranav Ganesan",
  email: "prganesan@ucsd.edu",
  url: "https://REPLACE-WITH-YOUR-NETLIFY-URL.netlify.app",
  year: new Date().getFullYear(),
  nav: [
    { label: "Home", url: "/" },
    { label: "About", url: "/about/" },
    { label: "Projects", url: "/projects/" },
    { label: "Contact", url: "/contact/" },
    { label: "Search", url: "/search/" }
  ],
  social: [
    { label: "GitHub", url: "https://github.com/pranavganesan" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/pranav-g-71b095308/" }
  ]
};
