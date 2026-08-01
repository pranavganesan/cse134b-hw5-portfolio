// Eleventy configuration for the HW5 portfolio site.
// Input lives in src/, generated output goes to _site/ (git-ignored).
module.exports = function (eleventyConfig) {
  // Static files copied through to the output as-is.
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/assets");

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
