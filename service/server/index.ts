import express from "express";
import vike from "vike-node/express";
import { imageVersion, imageRevision, version } from "./env";

import { telefunc } from "telefunc";
import { getOdooCli } from "./odooCli/utils";
import OdooJSONRpc from "./odooCli";

// @ts-ignore
export let odooCli: OdooJSONRpc = null;

const startServer = async () => {
  //
  odooCli = await getOdooCli();

  //
  const app = express();

  express.static("public");
  app.use(express.text());

  // Telefunc middleware
  app.all("/_telefunc", async (req, res) => {
    const httpResponse = await telefunc({
      // HTTP Request URL, which is '/_telefunc' if we didn't modify config.telefuncUrl
      url: req.url,
      // HTTP Request Method (GET, POST, ...)
      method: req.method,
      // HTTP Request Body, which can be a string, buffer, or stream
      body: req.body,
      // Optional
      context: {},
    });
    const { body, statusCode, contentType } = httpResponse;
    res.status(statusCode).type(contentType).send(body);
  });

  //
  app.use(
    vike({
      pageContext: (_) => {
        return {
          k8sApp: {
            imageVersion,
            imageRevision,
            version,
          },
        };
      },
    }),
  );

  //
  //
  //

  //
  const port = process.env.PORT ?? 3000;

  //
  app.listen(port, () => {
    //
    console.log("[INFO]", "Is Production build:", import.meta.env.PROD);
    console.log("[INFO]", "App Version:", version);

    //
    console.log(`Server running at http://localhost:${port}`);
  });
};

startServer();
