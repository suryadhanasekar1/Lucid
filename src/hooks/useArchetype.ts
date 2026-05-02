"use client";

import { useMemo } from "react";
import { getArchetype } from "@/lib/portfolio/calculations";
import type { Archetype } from "@/types";

export function useArchetype(riskScore: number): Archetype {
  return useMemo(() => getArchetype(riskScore), [riskScore]);
}
