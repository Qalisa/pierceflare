import { getOpenAPIObjectConfig } from "./api";
import { addApiRoutes } from "./api/routes";
import { createServer } from "./helpers/definition";

//
const getOpenAPIDoc = () => {
  const app = createServer();
  addApiRoutes(app);
  const doc = app.getOpenAPIDocument(
    getOpenAPIObjectConfig({
      apiVersion: process.env.OPENAPI_VERSION || "...",
    }),
  );
  console.log(JSON.stringify(doc, undefined, 2));
};

export default getOpenAPIDoc();
