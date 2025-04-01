type Primitive = string | number | boolean | symbol | null;
export type PrimitiveOrObject = Primitive | object;
export type PrimitiveOrObjectScalars = PrimitiveOrObject | PrimitiveOrObject[];
export type FObject = {
  [key: string]: PrimitiveOrObjectScalars;
};

export type OdooSearchDomain = PrimitiveOrObjectScalars;

export type OdooSearchReadOptions = {
  offset?: number;
  limit?: number;
  order?: string;
  context?: PrimitiveOrObjectScalars;
};

export type UserContext = {
  lang: string;
  tz: string;
  uid: number;
};

export type UserSettings = {
  id: number;
  user_id: UserId;
  is_discuss_sidebar_category_channel_open: boolean;
  is_discuss_sidebar_category_chat_open: boolean;
  push_to_talk_key: boolean;
  use_push_to_talk: boolean;
  voice_active_duration: number;
  volume_settings_ids: [string, PrimitiveOrObjectScalars[]][];
  homemenu_config: boolean;
};

export type UserId = {
  id: number;
};

//
//
//

export type OdooConnectionBase = {
  baseUrl: string;
  db: string;
  port?: number;
};

export type ConnectionWithSession = OdooConnectionBase & {
  sessionId: string;
};

export type ConnectionWithPasswordCredentials = OdooConnectionBase & {
  username: string;
  password: string;
};

export type ConnectionWithApiKeyCredentials = OdooConnectionBase & {
  username: string;
  apiKey: string;
};

export type OdooConnection =
  | ConnectionWithSession
  | ConnectionWithApiKeyCredentials
  | ConnectionWithPasswordCredentials;

//
//
//

export type OdooAuthenticateWithApiKeyResponse = {
  uid: number;
};

export type OdooAuthenticateWithCredentialsResponse =
  OdooAuthenticateWithApiKeyResponse & {
    is_system: boolean;
    is_admin: boolean;
    is_internal_user: boolean;
    user_context: UserContext;
    db: string;
    user_settings: UserSettings;
    server_version: string;
    server_version_info: [number, number, number, string, number, string];
    support_url: string;
    name: string;
    username: string;
    partner_display_name: string;
    partner_id: number;
    "web.base.url": string;
    active_ids_limit: number;
    profile_session: unknown;
    profile_collectors: unknown;
    profile_params: unknown;
    max_file_upload_size: number;
    home_action_id: boolean;
    cache_hashes: unknown;
    currencies: unknown;
    bundle_params: unknown;
    user_companies: unknown;
    show_effect: boolean;
    display_switch_company_menu: boolean;
    user_id: number[];
    max_time_between_keys_in_ms: number;
    web_tours: unknown[];
    tour_disable: boolean;
    notification_type: string;
    warning: string;
    expiration_date: string;
    expiration_reason: string;
    map_box_token: boolean;
    odoobot_initialized: boolean;
    iap_company_enrich: boolean;
    ocn_token_key: boolean;
    fcm_project_id: boolean;
    inbox_action: number;
    is_quick_edit_mode_enabled: string;
    dbuuid: string;
    multi_lang: boolean;
  };

export type OdooAuthenticateResponse =
  | OdooAuthenticateWithApiKeyResponse
  | OdooAuthenticateWithCredentialsResponse;
