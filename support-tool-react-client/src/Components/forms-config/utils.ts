import { FormConfigDetail, FormConfigRow } from "./types";

const asText = (value: any): string =>
  value === null || value === undefined ? "" : String(value);

/**
 * Pulls the config list out of the /formsConfig/v2/list response.
 * The payload lives at `result.formConfigurations`; the other lookups are
 * defensive fallbacks so an upstream rename degrades instead of breaking.
 */
const extractList = (response: any): any[] => {
  const result = response?.result;

  if (Array.isArray(result?.formConfigurations)) return result.formConfigurations;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result)) return result;
  if (Array.isArray(response)) return response;

  return [];
};

export const normalizeFormsConfigList = (response: any): FormConfigRow[] =>
  extractList(response).map((item, index) => {
    const id = item?.id ?? "";
    const name = asText(item?.name);
    const type = asText(item?.type);
    const subType = asText(item?.subType);
    const portal = asText(item?.portal);
    const clientVersion = item?.clientVersion ?? "";

    return {
      rowKey: `${asText(id) || "row"}-${name}-${index}`,
      id,
      name,
      type,
      subType,
      portal,
      clientVersion,
      searchIndex: [name, type, subType, portal, asText(clientVersion), asText(id)]
        .join(" ")
        .toLowerCase(),
      raw: item,
    };
  });

/**
 * Shapes the /formsConfig/v2/admin/read/{id} response.
 * The payload sits directly on `result` — the config blob under `result.data`.
 */
export const normalizeFormConfigDetail = (response: any): FormConfigDetail | null => {
  const result = response?.result;
  if (!result || typeof result !== "object") return null;

  return {
    data: result.data ?? {},
    criteria: result.criteria ?? null,
    name: asText(result.name),
    type: asText(result.type),
    subType: asText(result.subType),
    portal: asText(result.portal),
    clientVersion: result.clientVersion ?? "",
  };
};
