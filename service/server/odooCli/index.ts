import {
  OdooAuthenticateWithCredentialsResponse,
  OdooAuthenticateWithApiKeyResponse,
  OdooConnection,
  OdooSearchDomain,
  OdooSearchReadOptions,
  ConnectionWithPasswordCredentials,
  ConnectionWithApiKeyCredentials,
  OdooAuthenticateResponse,
  PrimitiveOrObject,
  FObject,
} from "./types";
import { isCredentialsResponse, Try } from "./utils";

export default class OdooJSONRpc {
  public is_connected = false;
  public url: string | undefined;

  //
  private _auth_response: OdooAuthenticateResponse | undefined;
  private _uid: number | undefined;

  //
  private _config: OdooConnection;
  private _session_id: string | undefined;
  private _api_key: string | undefined;

  //Initializes the OdooJSONRpc instance with the provided configuration.
  private _initialize() {
    if (!this._config.baseUrl || !this._config.db) {
      throw new Error(
        "Incomplete configuration. Please at least provide baseUrl and db",
      );
    }

    //
    const url = new URL(this._config.baseUrl);
    url.port = this._config.port?.toString() ?? "";
    this.url = url.toString();

    // try to determine default port if none provided
    this._config.port ??= (() => {
      if (this._config.baseUrl.startsWith("https")) return 443;
      return 80;
    })();

    //
    if ("sessionId" in this._config) {
      this._session_id = this._config.sessionId;
    } else if ("apiKey" in this._config) {
      this._api_key = this._config.apiKey;
    }
  }

  //
  //
  //

  //Connects to the Odoo server using an API key.
  private async _connectWithApiKey() {
    //
    const config = this._config as ConnectionWithApiKeyCredentials;

    //
    const endpoint = `${this.url}/jsonrpc`;
    const params = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "common",
        method: "authenticate",
        args: [config.db, config.username, config.apiKey, {}],
      },
      id: new Date().getTime(),
    };
    const [response, auth_error] = await Try(() =>
      fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      }),
    );
    if (auth_error) {
      throw auth_error;
    }
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const [body, body_parse_error] = await Try(() => response.json());
    if (body_parse_error) {
      throw body_parse_error;
    }
    const { result, odoo_error } = body;
    if (odoo_error) {
      throw new Error(body?.error?.data?.message);
    }
    this._uid = result;
    const out: OdooAuthenticateWithApiKeyResponse = { uid: result };
    return out;
  }
  //Connects to the Odoo server using username and password credentials.
  private async _connectWithCredentials() {
    //
    const config = this._config as ConnectionWithPasswordCredentials;

    //
    const endpoint = `${this.url}/web/session/authenticate`;
    const params = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        db: config.db,
        login: config.username,
        password: config.password,
      },
      id: new Date().getTime(),
    };
    const [response, auth_error] = await Try(() =>
      fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      }),
    );
    if (auth_error) {
      throw auth_error;
    }
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const [body, body_parse_error] = await Try(() => response.json());
    if (body_parse_error) {
      throw body_parse_error;
    }
    const { result, odoo_error, error } = body;
    if (odoo_error || error) {
      throw new Error(body?.error?.data?.message);
    }
    const cookies = response.headers.get("set-cookie");
    if (!cookies) {
      throw new Error(
        "Cookie not found in response headers, please check your credentials",
      );
    }
    if (!cookies.includes("session_id")) {
      throw new Error("session_id not found in cookies");
    }
    const sessionId = cookies
      .split(";")
      .find((cookie) => cookie.includes("session_id"))!
      .split("=")[1];
    this._session_id = sessionId;
    this._auth_response = result;
    return result as OdooAuthenticateWithCredentialsResponse;
  }

  //Connects to the Odoo server using an existing session ID.
  private async _connectWithSessionId() {
    const endpoint = `${this.url}/web/session/get_session_info`;
    const params = {
      jsonrpc: "2.0",
      method: "call",
      params: {},
      id: new Date().getTime(),
    };
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this._session_id) {
      headers["X-Openerp-Session-Id"] = this._session_id;
      headers["Cookie"] = `session_id=${this._session_id}`;
    } else {
      throw new Error("session_id not found. Please connect first.");
    }
    const [response, auth_error] = await Try(() =>
      fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(params),
      }),
    );
    if (auth_error) {
      throw auth_error;
    }
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const [body, body_parse_error] = await Try(() => response.json());
    if (body_parse_error) {
      throw body_parse_error;
    }
    const { result, odoo_error } = body;
    if (odoo_error) {
      throw new Error(body?.error?.data?.message);
    }
    this._auth_response = result;

    //
    return result as OdooAuthenticateWithCredentialsResponse;
  }

  //Calls a method on the Odoo server using UID and API key authentication.
  private async _callWithUid<T>(
    model: string,
    method: string,
    args: PrimitiveOrObject[],
    kwargs: FObject = {},
  ) {
    const endpoint = `${this.url}/jsonrpc`;
    const params = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: [
          this._config.db,
          this._uid,
          this._api_key,
          model,
          method,
          args,
          kwargs,
        ],
      },
      id: new Date().getTime(),
    };
    const headers = {
      "Content-Type": "application/json",
    };
    const [response, request_error] = await Try(() =>
      fetch(endpoint, {
        headers,
        method: "POST",
        body: JSON.stringify(params),
      }),
    );
    if (request_error) {
      throw request_error;
    }
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const [body, body_parse_error] = await Try(() => response.json());
    if (body_parse_error) {
      throw body_parse_error;
    }
    const { result, error } = body;
    if (error) {
      throw new Error(body?.error?.data?.message);
    }
    return result as T;
  }

  //Calls a method on the Odoo server using session ID authentication.
  private async _callWithSessionId<T>(
    model: string,
    method: string,
    args: PrimitiveOrObject[],
    kwargs: FObject = {},
  ) {
    const endpoint = `${this.url}/web/dataset/call_kw`;
    const params = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        model,
        method,
        args,
        kwargs,
      },
      id: new Date().getTime(),
    };

    //
    const headers: HeadersInit = new Headers({
      "Content-Type": "application/json",
      Cookie: `session_id=${this._session_id}`,
    });
    headers.set("X-Openerp-Session-Id", this._session_id ?? "");

    //
    const [response, request_error] = await Try(() =>
      fetch(endpoint, {
        headers,
        method: "POST",
        body: JSON.stringify(params),
      }),
    );
    if (request_error) {
      throw request_error;
    }
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const [body, body_parse_error] = await Try(() => response.json());
    if (body_parse_error) {
      throw body_parse_error;
    }
    const { result, error } = body;
    if (error) {
      throw new Error(body?.error?.data?.message);
    }
    return result as T;
  }

  //
  //
  //

  constructor(config: OdooConnection) {
    this._config = config;
    this._initialize();
  }

  ///

  get uId() {
    return this._uid ?? this._auth_response?.uid;
  }
  get authResponse() {
    return this._auth_response;
  }
  get sessionId() {
    return this._session_id;
  }
  get port() {
    return this._config.port ? Number(this._config.port) : this._config.port;
  }

  ///

  //Connects to the Odoo server using the provided or existing configuration.
  async connect() {
    const result = await ("sessionId" in this._config
      ? this._connectWithSessionId()
      : "apiKey" in this._config
        ? this._connectWithApiKey()
        : this._connectWithCredentials());

    if (!result) {
      throw new Error("Authentication failed. Please check your credentials.");
    }

    //
    if (!isCredentialsResponse(result)) {
      this._uid = result.uid;
    }

    //
    this._auth_response = result;
    this.is_connected = true;

    //
    return result;
  }

  //Calls a method on the Odoo server using the RPC protocol.
  async call_kw<T>(
    model: string,
    method: string,
    args: PrimitiveOrObject[],
    kwargs: FObject = {},
  ) {
    if (!this.is_connected) {
      this._auth_response = await this.connect();
    }

    if (this._session_id) {
      return this._callWithSessionId<T>(model, method, args, kwargs);
    } else if (this._uid) {
      return this._callWithUid<T>(model, method, args, kwargs);
    }

    this.is_connected = false;
    throw new Error("Please connect with credentials or api key first.");
  }

  //Creates a new record in the specified Odoo model.
  async create(model: string, values: FObject) {
    return this.call_kw<number>(model, "create", [values]);
  }

  //Reads records from the specified Odoo model.
  async read<T>(model: string, id: number | number[], fields: string[]) {
    return this.call_kw<T>(model, "read", [id, fields]);
  }

  //Updates a record in the specified Odoo model.
  async update(model: string, id: number, values: FObject) {
    return this.call_kw<boolean>(model, "write", [[id], values]);
  }

  /**
   * Updates the translations for a field in the specified Odoo model.
   * @param model Model to update eg. product.template
   * @param id Id of the model to update
   * @param field field to update eg. name
   * @param translations object with translations eg. {de_DE: "Neuer Name", en_GB: "Name"}
   */
  async updateFieldTranslations(
    model: string,
    id: number,
    field: string,
    translations: { [key: string]: string },
  ) {
    return this.call_kw<boolean>(model, "update_field_translations", [
      [id],
      field,
      translations,
    ]);
  }

  //Deletes a record from the specified Odoo model.
  async delete(model: string, id: number) {
    return this.call_kw<boolean>(model, "unlink", [[id]]);
  }

  //Searches and reads records from the specified Odoo model.
  async searchRead<T extends FObject>(
    model: string,
    domain: OdooSearchDomain,
    fields: string[],
    opts?: OdooSearchReadOptions,
  ) {
    return (
      ((await this.call_kw(
        model,
        "search_read",
        [domain, fields],
        opts,
      )) as T[]) || []
    );
  }

  //Searches for records in the specified Odoo model.
  async search(model: string, domain: OdooSearchDomain) {
    return (await this.call_kw<number[]>(model, "search", [domain])) || [];
  }

  //Retrieves the fields information for the specified Odoo model.
  async getFields(model: string) {
    return this.call_kw(model, "fields_get", []);
  }

  //Executes an action on the specified Odoo model for given record IDs.
  async action(model: string, action: string, ids: number[]) {
    return this.call_kw<boolean>(model, action, ids);
  }

  //Creates an external ID for a record in the specified Odoo model.
  async createExternalId(
    model: string,
    recordId: number,
    externalId: string,
    moduleName?: string,
  ) {
    return await this.call_kw<number>("ir.model.data", "create", [
      [
        {
          model: model,
          name: `${externalId}`,
          res_id: recordId,
          module: moduleName || "__api__",
        },
      ],
    ]);
  }

  //Searches for a record by its external ID.
  async searchByExternalId(externalId: string) {
    const irModelData = await this.searchRead(
      "ir.model.data",
      [["name", "=", externalId]],
      ["res_id"],
    );
    if (!irModelData.length) {
      throw new Error(
        `No matching record found for external identifier ${externalId}`,
      );
    }
    return irModelData[0]["res_id"] as number;
  }

  //Reads a record by its external ID.
  async readByExternalId<T>(
    externalId: string,
    fields: string[] = [],
  ): Promise<T> {
    const irModelData = await this.searchRead(
      "ir.model.data",
      [["name", "=", externalId]],
      ["res_id", "model"],
    );
    if (!irModelData.length) {
      throw new Error(
        `No matching record found for external identifier ${externalId}`,
      );
    }
    return (
      await this.read<FObject>(
        irModelData[0].model as string,
        [irModelData[0].res_id as number],
        fields,
      )
    )[0] as T;
  }

  //Updates a record by its external ID.
  async updateByExternalId(externalId: string, params: FObject = {}) {
    const irModelData = await this.searchRead(
      "ir.model.data",
      [["name", "=", externalId]],
      ["res_id", "model"],
    );
    if (!irModelData.length) {
      throw new Error(
        `No matching record found for external identifier ${externalId}`,
      );
    }
    return await this.update(
      irModelData[0].model as string,
      irModelData[0].res_id as number,
      params,
    );
  }

  //Deletes a record by its external ID.
  async deleteByExternalId(externalId: string) {
    const irModelData = await this.searchRead(
      "ir.model.data",
      [["name", "=", externalId]],
      ["res_id", "model"],
    );
    if (!irModelData.length) {
      throw new Error(`No matching record found for external ID ${externalId}`);
    }
    return await this.delete(
      irModelData[0].model as string,
      irModelData[0].res_id as number,
    );
  }

  //Disconnects from the Odoo server
  async disconnect() {
    const endpoint = `${this.url}/web/session/destroy`;
    const params = {
      jsonrpc: "2.0",
      method: "call",
      params: {},
      id: new Date().getTime(),
    };
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this._session_id) {
      headers["X-Openerp-Session-Id"] = this._session_id;
      headers["Cookie"] = `session_id=${this._session_id}`;
    } else {
      throw new Error("session_id not found. Please connect first.");
    }

    const [response, auth_error] = await Try(() =>
      fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(params),
      }),
    );

    if (auth_error) {
      throw auth_error;
    }
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const [body, body_parse_error] = await Try(() => response.json());
    if (body_parse_error) {
      throw body_parse_error;
    }
    const { error } = body;
    if (error) {
      throw new Error(body?.error?.data?.message);
    }
    this.is_connected = false;
    this._auth_response = undefined;
    this._uid = undefined;
    this._session_id = undefined;
    return true;
  }
}
