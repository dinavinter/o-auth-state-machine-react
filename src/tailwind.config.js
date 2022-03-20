module.exports = {
  purge: ["./pages/**/**.{ts,tsx,mdx}", "./lib/**/**.{ts,tsx,mdx}"],
  plugins: [require("@tailwindcss/typography")],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
};
