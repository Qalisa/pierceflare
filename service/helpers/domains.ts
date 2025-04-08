export const isValidSubdomain = (subdomain: string) => {
  const subdomainRegex = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;
  return subdomainRegex.test(subdomain);
};
