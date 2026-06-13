import type { Variant, VariantConfig } from "../types";
import { CRAPLESS } from "./crapless";
import { STANDARD } from "./standard";

export function getVariantConfig(variant: Variant): VariantConfig {
  return variant === "standard" ? STANDARD : CRAPLESS;
}
