// Constantes da Tag Manager API v2 confirmadas contra o discovery document oficial
// (https://tagmanager.googleapis.com/$discovery/rest?version=v2) e/ou amplamente
// documentadas pela comunidade GTM. Tipos de tag/variável internos não são
// publicados na referência REST do Google (só aparecem como "string" livre),
// então os valores abaixo vêm de exports reais de containers.

export const TAG_TYPE_GOOGLE_ADS_CONVERSION = "awct";
export const TAG_TYPE_CONVERSION_LINKER = "gclidw";

export const VARIABLE_TYPE_DATA_LAYER = "v";
export const VARIABLE_TYPE_CUSTOM_JS = "jsm";

export const TRIGGER_TYPE_CUSTOM_EVENT = "customEvent";
export const TRIGGER_TYPE_FORM_SUBMISSION = "formSubmission";
export const TRIGGER_TYPE_PAGEVIEW = "pageview";

export const BUILT_IN_VARIABLE_FORM_ID = "formId";

// ID fixo do gatilho padrão "All Pages", presente por padrão em todo workspace novo.
// O código sempre tenta localizar esse gatilho dinamicamente pela API antes de usar
// esta constante como último recurso.
export const ALL_PAGES_TRIGGER_ID_FALLBACK = "2147479553";

export const DATA_LAYER_VARIABLES = [
  { name: "dlv - user_email", dataLayerKey: "user_email" },
  { name: "dlv - user_phone", dataLayerKey: "user_phone" },
  { name: "dlv - user_first_name", dataLayerKey: "user_first_name" },
  { name: "dlv - user_last_name", dataLayerKey: "user_last_name" },
];

export const EVENT_ID_VARIABLE_NAME = "js - event id (dedup)";
export const ENHANCED_CONVERSIONS_DATA_VARIABLE_NAME = "js - enhanced conversions data";

// Referência real da Community Template Gallery para o template oficial
// "Meta Pixel" (publisher: Facebook). O código de importação (lib/metaTemplate.js)
// baixa o template.tpl diretamente deste repositório.
export const META_GALLERY_REFERENCE = {
  host: "github.com",
  owner: "facebook",
  repository: "GoogleTagManager-WebTemplate-For-FacebookPixel",
  version: "1",
};

export const META_TEMPLATE_TPL_URL =
  "https://raw.githubusercontent.com/facebook/GoogleTagManager-WebTemplate-For-FacebookPixel/main/template.tpl";

// Mapa de campo de Advanced Matching (Meta) -> coluna "name" do template oficial.
export const META_ADVANCED_MATCHING_FIELD_MAP = {
  email: "em",
  phone: "ph",
  first_name: "fn",
  last_name: "ln",
};

export const META_STANDARD_EVENTS = [
  "Lead",
  "Purchase",
  "CompleteRegistration",
  "Contact",
  "AddToCart",
  "InitiateCheckout",
];

export const gtmWorkspaceUrl = (accountId, containerId, workspaceId) =>
  `https://tagmanager.google.com/#/container/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`;
