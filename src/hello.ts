import { cloudflare, github } from "./svg";

export const hello = () => ({
  charset: "utf-8",
  title: "unfurl microservice",
  description: "unfurl microservice by @artlu",
});

export const landingPage = () => {
  return `
<head>
  <title>unfurl microservice by @artlu99</title>
</head>
<body>
  <h2>unfurl microservice <a href="https://github.com/artlu99/unfurl" target="_blank">${github}</a></h2> 
  <h3> ${cloudflare} CF Workers on Hono 
 </h3>
</body>`;
};
