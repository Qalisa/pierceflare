import logo404 from "@/assets/images/404.webp";

export default {
  // Default <title>
  title: "Woops ! Page not found :(",
  // Default <meta name="description">
  description: `You are trying to access a page that did or never existed. You should rather go back to ${process.env.CANONICAL_URL}.`,
  //
  image: logo404,
};
