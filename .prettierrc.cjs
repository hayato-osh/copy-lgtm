/**
 * @type {import('prettier').Options}
 */
module.exports = {
  trailingComma: "all",
  plugins: [require.resolve("@plasmohq/prettier-plugin-sort-imports")],
};
