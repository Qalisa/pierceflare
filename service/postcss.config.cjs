/** DO NOT CHANGE FILE FORMAT UNTIL TAILWIND V4 MIGRATION !! OVERWISE, TAILWIND WONT WORK SPECIFICALLY IN DOCKER FOR SOME REASON */
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    ...(process.env.NODE_ENV === "production" ? { cssnano: {} } : {}),
  },
};
