import { gtm } from "./gtmClient";
import {
  TAG_TYPE_GOOGLE_ADS_CONVERSION,
  TAG_TYPE_CONVERSION_LINKER,
  VARIABLE_TYPE_DATA_LAYER,
  VARIABLE_TYPE_CUSTOM_JS,
  TRIGGER_TYPE_CUSTOM_EVENT,
  TRIGGER_TYPE_FORM_SUBMISSION,
  TRIGGER_TYPE_PAGEVIEW,
  BUILT_IN_VARIABLE_FORM_ID,
  ALL_PAGES_TRIGGER_ID_FALLBACK,
  DATA_LAYER_VARIABLES,
  EVENT_ID_VARIABLE_NAME,
  META_GALLERY_REFERENCE,
  META_TEMPLATE_TPL_URL,
  META_ADVANCED_MATCHING_FIELD_MAP,
} from "./constants";

function findByName(list, name) {
  if (!list || !name) return null;
  const target = name.trim().toLowerCase();
  return list.find((item) => (item.name || "").trim().toLowerCase() === target) || null;
}

function mapRow(name, value) {
  return {
    type: "map",
    map: [
      { type: "template", key: "name", value: name },
      { type: "template", key: "value", value },
    ],
  };
}

async function ensureBuiltInVariable(token, workspacePath, type) {
  const { builtInVariable } = await gtm
    .listBuiltInVariables(token, workspacePath)
    .catch(() => ({ builtInVariable: [] }));
  const alreadyEnabled = (builtInVariable || []).some((v) => v.type === type);
  if (alreadyEnabled) return;
  await gtm.enableBuiltInVariable(token, workspacePath, type);
}

async function findAllPagesTriggerId(token, workspacePath) {
  const { trigger } = await gtm.listTriggers(token, workspacePath).catch(() => ({ trigger: [] }));
  const found = (trigger || []).find(
    (t) => t.type === TRIGGER_TYPE_PAGEVIEW && (t.name || "").trim().toLowerCase() === "all pages"
  );
  return found ? found.triggerId : ALL_PAGES_TRIGGER_ID_FALLBACK;
}

/**
 * Garante que o gatilho exista: reaproveita um já selecionado, reaproveita um
 * existente com o mesmo nome, ou cria um novo (Custom Event ou Form Submission).
 */
export async function ensureTrigger(token, workspacePath, input) {
  if (input.mode === "existing") {
    return { triggerId: input.triggerId, created: false, reused: false };
  }

  const { trigger: existingTriggers } = await gtm
    .listTriggers(token, workspacePath)
    .catch(() => ({ trigger: [] }));
  const existing = findByName(existingTriggers, input.name);
  if (existing) {
    return { triggerId: existing.triggerId, name: existing.name, created: false, reused: true };
  }

  let body;
  if (input.type === TRIGGER_TYPE_CUSTOM_EVENT) {
    body = {
      name: input.name,
      type: TRIGGER_TYPE_CUSTOM_EVENT,
      customEventFilter: [
        {
          type: "equals",
          parameter: [
            { type: "template", key: "arg0", value: "{{_event}}" },
            { type: "template", key: "arg1", value: input.eventName },
          ],
        },
      ],
    };
  } else if (input.type === TRIGGER_TYPE_FORM_SUBMISSION) {
    await ensureBuiltInVariable(token, workspacePath, BUILT_IN_VARIABLE_FORM_ID);
    body = {
      name: input.name,
      type: TRIGGER_TYPE_FORM_SUBMISSION,
      filter: [
        {
          type: "equals",
          parameter: [
            { type: "template", key: "arg0", value: "{{Form ID}}" },
            { type: "template", key: "arg1", value: input.formCondition },
          ],
        },
      ],
      waitForTags: { type: "boolean", value: "false" },
      checkValidation: { type: "boolean", value: "false" },
    };
  } else {
    throw new Error("Tipo de gatilho não suportado.");
  }

  const created = await gtm.createTrigger(token, workspacePath, body);
  return { triggerId: created.triggerId, name: created.name, created: true, reused: false };
}

/**
 * Garante que exista uma tag "Conversion Linker" disparando em All Pages.
 */
export async function ensureConversionLinker(token, workspacePath) {
  const { tag } = await gtm.listTags(token, workspacePath).catch(() => ({ tag: [] }));
  const existing = (tag || []).find((t) => t.type === TAG_TYPE_CONVERSION_LINKER);
  if (existing) {
    return { created: false, tag: existing };
  }

  const allPagesTriggerId = await findAllPagesTriggerId(token, workspacePath);
  const created = await gtm.createTag(token, workspacePath, {
    name: "Conversion Linker",
    type: TAG_TYPE_CONVERSION_LINKER,
    firingTriggerId: [allPagesTriggerId],
    parameter: [{ type: "boolean", key: "enableAutoDetectClickIds", value: "true" }],
  });
  return { created: true, tag: created };
}

/**
 * Garante que as 4 variáveis de camada de dados usadas para Enhanced
 * Conversions / Advanced Matching existam no workspace.
 */
export async function ensureUserDataVariables(token, workspacePath) {
  const { variable: existingVars } = await gtm
    .listVariables(token, workspacePath)
    .catch(() => ({ variable: [] }));

  const results = [];
  for (const def of DATA_LAYER_VARIABLES) {
    const existing = findByName(existingVars, def.name);
    if (existing) {
      results.push({ name: def.name, created: false });
      continue;
    }
    await gtm.createVariable(token, workspacePath, {
      name: def.name,
      type: VARIABLE_TYPE_DATA_LAYER,
      parameter: [
        { type: "template", key: "name", value: def.dataLayerKey },
        { type: "integer", key: "dataLayerVersion", value: "2" },
      ],
    });
    results.push({ name: def.name, created: true });
  }
  return results;
}

/**
 * Garante que exista uma variável Custom JavaScript geradora de ID único,
 * usada para deduplicação (Meta Pixel + futura Conversions API).
 */
export async function ensureEventIdVariable(token, workspacePath) {
  const { variable: existingVars } = await gtm
    .listVariables(token, workspacePath)
    .catch(() => ({ variable: [] }));
  const existing = findByName(existingVars, EVENT_ID_VARIABLE_NAME);
  if (existing) {
    return { name: EVENT_ID_VARIABLE_NAME, created: false };
  }

  await gtm.createVariable(token, workspacePath, {
    name: EVENT_ID_VARIABLE_NAME,
    type: VARIABLE_TYPE_CUSTOM_JS,
    parameter: [
      {
        type: "template",
        key: "javascript",
        value:
          "function() {\n  return 'ev.' + Date.now() + '.' + Math.random().toString(36).slice(2, 10);\n}",
      },
    ],
  });
  return { name: EVENT_ID_VARIABLE_NAME, created: true };
}

/**
 * Garante que o template oficial "Meta Pixel" (Community Template Gallery,
 * publisher: Facebook) exista no workspace, importando-o do GitHub quando
 * necessário.
 */
export async function ensureMetaTemplate(token, workspacePath) {
  const { template: existingTemplates } = await gtm
    .listTemplates(token, workspacePath)
    .catch(() => ({ template: [] }));
  const existing = (existingTemplates || []).find(
    (t) =>
      t.galleryReference?.owner === META_GALLERY_REFERENCE.owner ||
      /meta pixel|facebook pixel/i.test(t.name || "")
  );
  if (existing) {
    return { templateId: existing.templateId, created: false };
  }

  const response = await fetch(META_TEMPLATE_TPL_URL);
  if (!response.ok) {
    throw new Error(
      "Não foi possível baixar o template oficial do Meta Pixel a partir do GitHub."
    );
  }
  const templateData = await response.text();

  const created = await gtm.createTemplate(token, workspacePath, {
    name: "Meta Pixel",
    templateData,
    galleryReference: META_GALLERY_REFERENCE,
  });
  return { templateId: created.templateId, created: true };
}

/**
 * Cria a tag nativa de conversão do Google Ads (awct), garantindo o
 * Conversion Linker e (opcionalmente) as variáveis de Enhanced Conversions.
 */
export async function createGoogleAdsTag(token, workspacePath, input) {
  const triggerResult = await ensureTrigger(token, workspacePath, input.trigger);
  const linkerResult = await ensureConversionLinker(token, workspacePath);

  let userDataVars = [];
  if (input.includeUserData) {
    userDataVars = await ensureUserDataVariables(token, workspacePath);
  }

  const parameter = [
    { type: "template", key: "conversionId", value: input.conversionId },
    { type: "template", key: "conversionLabel", value: input.conversionLabel },
    { type: "boolean", key: "enableConversionLinker", value: "true" },
  ];

  if (input.includeUserData) {
    parameter.push({ type: "boolean", key: "enableEnhancedConversion", value: "true" });
    parameter.push({
      type: "list",
      key: "enhancedConversionsManualDataObject",
      list: [
        mapRow("email", "{{dlv - user_email}}"),
        mapRow("phone_number", "{{dlv - user_phone}}"),
        mapRow("first_name", "{{dlv - user_first_name}}"),
        mapRow("last_name", "{{dlv - user_last_name}}"),
      ],
    });
  }

  const tag = await gtm.createTag(token, workspacePath, {
    name: input.name,
    type: TAG_TYPE_GOOGLE_ADS_CONVERSION,
    parameter,
    firingTriggerId: [triggerResult.triggerId],
  });

  return { tag, triggerResult, linkerResult, userDataVars };
}

/**
 * Cria a tag Meta Pixel usando o template oficial da Community Template
 * Gallery, com event_id para deduplicação e (opcionalmente) Advanced Matching.
 */
export async function createMetaTag(token, workspacePath, input) {
  const triggerResult = await ensureTrigger(token, workspacePath, input.trigger);
  const templateResult = await ensureMetaTemplate(token, workspacePath);
  const eventIdVar = await ensureEventIdVariable(token, workspacePath);

  let userDataVars = [];
  if (input.includeUserData) {
    userDataVars = await ensureUserDataVariables(token, workspacePath);
  }

  const parameter = [
    { type: "template", key: "pixelId", value: input.pixelId },
    { type: "template", key: "eventName", value: input.isCustomEvent ? "custom" : "standard" },
    input.isCustomEvent
      ? { type: "template", key: "customEventName", value: input.eventName }
      : { type: "template", key: "standardEventName", value: input.eventName },
    { type: "template", key: "eventId", value: `{{${eventIdVar.name}}}` },
    { type: "boolean", key: "advancedMatching", value: input.includeUserData ? "true" : "false" },
  ];

  if (input.includeUserData) {
    parameter.push({
      type: "list",
      key: "advancedMatchingList",
      list: [
        mapRow(META_ADVANCED_MATCHING_FIELD_MAP.email, "{{dlv - user_email}}"),
        mapRow(META_ADVANCED_MATCHING_FIELD_MAP.phone, "{{dlv - user_phone}}"),
        mapRow(META_ADVANCED_MATCHING_FIELD_MAP.first_name, "{{dlv - user_first_name}}"),
        mapRow(META_ADVANCED_MATCHING_FIELD_MAP.last_name, "{{dlv - user_last_name}}"),
      ],
    });
  }

  const tagType = `cvt_${input.containerId}_${templateResult.templateId}`;

  const tag = await gtm.createTag(token, workspacePath, {
    name: input.name,
    type: tagType,
    parameter,
    firingTriggerId: [triggerResult.triggerId],
  });

  return { tag, triggerResult, templateResult, eventIdVar, userDataVars };
}

/**
 * Cria uma versão a partir do workspace e a publica imediatamente
 * (equivalente ao botão "Enviar" da UI do GTM). São duas chamadas de API
 * porque create_version por si só não torna a versão live.
 */
export async function publishWorkspace(token, workspacePath, { name, notes }) {
  const versionResponse = await gtm.createVersion(token, workspacePath, { name, notes });
  const containerVersion = versionResponse.containerVersion;
  await gtm.publishVersion(token, containerVersion.path);
  return { containerVersion };
}
