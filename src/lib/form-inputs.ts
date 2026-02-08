import type { Sex } from "@prisma/client";

type ValuesMap = Record<string, string>;

type InputRuleContext = {
  key: string;
  value: string;
  values: ValuesMap;
  sex?: Sex | null;
};

type ConversionPair = {
  fromKey: string;
  toKey: string;
  factor: number;
};

const HBA1C_OFFSET = 2.152;
const HBA1C_SLOPE = 0.09148;
const BILI_CONVERSION = 17.1;
const FEMALE_FBS_RBS_FACTOR = 0.0554951033732318;
const FEMALE_CREA_FACTOR = 88.8524590163934;
const FEMALE_BUN_FACTOR = 0.165970375996961;
const FEMALE_BUA_FACTOR = 59.5;

const FEMALE_CONVERSION_OVERRIDES: Record<string, number> = {
  "chem.fbs_CU_val": FEMALE_FBS_RBS_FACTOR,
  "chem.fbs_SU_val": 1 / FEMALE_FBS_RBS_FACTOR,
  "chem.rbs_CU_val": FEMALE_FBS_RBS_FACTOR,
  "chem.rbs_SU_val": 1 / FEMALE_FBS_RBS_FACTOR,
  "chem.crea_CU_val": FEMALE_CREA_FACTOR,
  "chem.crea_SU_val": 1 / FEMALE_CREA_FACTOR,
  "chem.bun_CU_val": FEMALE_BUN_FACTOR,
  "chem.bun_SU_val": 1 / FEMALE_BUN_FACTOR,
  "chem.bua_CU_val": FEMALE_BUA_FACTOR,
  "chem.bua_SU_val": 1 / FEMALE_BUA_FACTOR,
};

const CHEM_CONVERSIONS: ConversionPair[] = [
  {
    fromKey: "chem.fbs_CU_val",
    toKey: "chem.fbs_SU_val",
    factor: 0.0554915854738707,
  },
  {
    fromKey: "chem.fbs_SU_val",
    toKey: "chem.fbs_CU_val",
    factor: 1 / 0.0554915854738707,
  },
  {
    fromKey: "chem.rbs_CU_val",
    toKey: "chem.rbs_SU_val",
    factor: 0.0554915854738707,
  },
  {
    fromKey: "chem.rbs_SU_val",
    toKey: "chem.rbs_CU_val",
    factor: 1 / 0.0554915854738707,
  },
  {
    fromKey: "chem.tc_CU_val",
    toKey: "chem.tc_SU_val",
    factor: 0.0259997360432889,
  },
  {
    fromKey: "chem.tc_SU_val",
    toKey: "chem.tc_CU_val",
    factor: 1 / 0.0259997360432889,
  },
  {
    fromKey: "chem.hdl_CU_val",
    toKey: "chem.hdl_SU_val",
    factor: 0.0259997360432889,
  },
  {
    fromKey: "chem.hdl_SU_val",
    toKey: "chem.hdl_CU_val",
    factor: 1 / 0.0259997360432889,
  },
  {
    fromKey: "chem._ldl_CU_val",
    toKey: "chem.ldl_SU_val",
    factor: 0.0259997360432889,
  },
  {
    fromKey: "chem.ldl_SU_val",
    toKey: "chem._ldl_CU_val",
    factor: 1 / 0.0259997360432889,
  },
  {
    fromKey: "chem.vldl_CU_val",
    toKey: "chem.vldl_SU_val",
    factor: 0.0259997360432889,
  },
  {
    fromKey: "chem.vldl_SU_val",
    toKey: "chem.vldl_CU_val",
    factor: 1 / 0.0259997360432889,
  },
  {
    fromKey: "chem.tri_val",
    toKey: "chem.tri_SU_val",
    factor: 0.0112997464447139,
  },
  {
    fromKey: "chem.tri_SU_val",
    toKey: "chem.tri_val",
    factor: 1 / 0.0112997464447139,
  },
  {
    fromKey: "chem.crea_CU_val",
    toKey: "chem.crea_SU_val",
    factor: 88.021978021978,
  },
  {
    fromKey: "chem.crea_SU_val",
    toKey: "chem.crea_CU_val",
    factor: 1 / 88.021978021978,
  },
  {
    fromKey: "chem.bun_CU_val",
    toKey: "chem.bun_SU_val",
    factor: 0.165978530140379,
  },
  {
    fromKey: "chem.bun_SU_val",
    toKey: "chem.bun_CU_val",
    factor: 1 / 0.165978530140379,
  },
  {
    fromKey: "chem.bua_CU_val",
    toKey: "chem.bua_SU_val",
    factor: 59.4582723279648,
  },
  {
    fromKey: "chem.bua_SU_val",
    toKey: "chem.bua_CU_val",
    factor: 1 / 59.4582723279648,
  },
  {
    fromKey: "chem.sgpt_CU_val",
    toKey: "chem.sgpt_SU_val",
    factor: 1,
  },
  {
    fromKey: "chem.sgpt_SU_val",
    toKey: "chem.sgpt_CU_val",
    factor: 1,
  },
  {
    fromKey: "chem.sgot_CU_val",
    toKey: "chem.sgot_SU_val",
    factor: 1,
  },
  {
    fromKey: "chem.sgot_SU_val",
    toKey: "chem.sgot_CU_val",
    factor: 1,
  },
  {
    fromKey: "chem.tb_CU_val",
    toKey: "chem.tb_SU_val",
    factor: BILI_CONVERSION,
  },
  {
    fromKey: "chem.tb_SU_val",
    toKey: "chem.tb_CU_val",
    factor: 1 / BILI_CONVERSION,
  },
  {
    fromKey: "chem.db_CU_val",
    toKey: "chem.db_SU_val",
    factor: BILI_CONVERSION,
  },
  {
    fromKey: "chem.db_SU_val",
    toKey: "chem.db_CU_val",
    factor: 1 / BILI_CONVERSION,
  },
  {
    fromKey: "chem.ggt_CU_val",
    toKey: "chem.ggt_SU_val",
    factor: 1,
  },
  {
    fromKey: "chem.ggt_SU_val",
    toKey: "chem.ggt_CU_val",
    factor: 1,
  },
  {
    fromKey: "chem.alp_CU_val",
    toKey: "chem.alp_SU_val",
    factor: 1,
  },
  {
    fromKey: "chem.alp_SU_val",
    toKey: "chem.alp_CU_val",
    factor: 1,
  },
];

const FLAG_KEYS_BY_VALUE: Record<string, string[]> = {
  "chem.fbs_CU_val": ["chem.fbs_CU_flag"],
  "chem.fbs_SU_val": ["chem.fbs_SU_flag"],
  "chem.rbs_CU_val": ["chem.rbs_CU_flag"],
  "chem.rbs_SU_val": ["chem.rbs_SU_flag"],
  "chem.tc_CU_val": ["chem.tc_CU_flag"],
  "chem.tc_SU_val": ["chem.tc_SU_flag"],
  "chem.hdl_CU_val": ["chem.hdl_CU_flag"],
  "chem.hdl_SU_val": ["chem.hdl_SU_flag"],
  "chem._ldl_CU_val": ["chem.ldl_CU_flag"],
  "chem.ldl_SU_val": ["chem.ldl_SU_flag"],
  "chem.vldl_CU_val": ["chem.vldl_CU_flag"],
  "chem.vldl_SU_val": ["chem.vldl_SU_flag"],
  "chem.tri_val": ["chem.tri_CU_flag"],
  "chem.tri_SU_val": ["chem.tri_SU_flag"],
  "chem.crea_CU_val": ["chem.crea_CU_flag"],
  "chem.crea_SU_val": ["chem.crea_SU_flag"],
  "chem.bun_CU_val": ["chem.bun_CU_flag"],
  "chem.bun_SU_val": ["chem.bun_SU_flag"],
  "chem.bua_CU_val": ["chem.bua_CU_flag"],
  "chem.bua_SU_val": ["chem.bua_SU_flag"],
  "chem.sgpt_CU_val": ["chem.sgpt_CU_flag"],
  "chem.sgpt_SU_val": ["chem.sgpt_SU_flag"],
  "chem.sgot_CU_val": ["chem.sgot_CU_flag"],
  "chem.sgot_SU_val": ["chem.sgot_SU_flag"],
  "chem.tb_CU_val": ["chem.tb_CU_flag"],
  "chem.tb_SU_val": ["chem.tb_SU_flag"],
  "chem.db_CU_val": ["chem.db_CU_flag"],
  "chem.db_SU_val": ["chem.db_SU_flag"],
  "chem.ib_CU_val": ["chem.ib_CU_flag"],
  "chem.ib_SU_val": ["chem.ib_SU_flag"],
  "chem.ggt_CU_val": ["chem.ggt_CU_flag"],
  "chem.ggt_SU_val": ["chem.ggt_SU_flag"],
  "chem.alp_CU_val": ["chem.alp_CU_flag"],
  "chem.alp_SU_val": ["chem.alp_SU_flag"],
  "chem.hba1c_CU_val": ["chem.hba1c_CU_flag"],
  "chem.hba1c_SU_val": ["chem.hba1c_SU_flag"],
};

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return "";
  const rounded = value.toFixed(2);
  return rounded.replace(/\.?0+$/, "");
};

const parseNumber = (raw: string | undefined) => {
  if (raw === undefined) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : null;
};

const applyConversions = ({ key, value, sex }: InputRuleContext): ValuesMap => {
  const updates: ValuesMap = {};
  const trimmed = value.trim();
  if (!trimmed) {
    if (key === "chem.hba1c_CU_val") updates["chem.hba1c_SU_val"] = "";
    if (key === "chem.hba1c_SU_val") updates["chem.hba1c_CU_val"] = "";
    const conversion = CHEM_CONVERSIONS.find((c) => c.fromKey === key);
    if (conversion) updates[conversion.toKey] = "";
    return updates;
  }

  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric)) return updates;

  if (key === "chem.hba1c_CU_val") {
    updates["chem.hba1c_SU_val"] = formatNumber((numeric - HBA1C_OFFSET) / HBA1C_SLOPE);
    return updates;
  }
  if (key === "chem.hba1c_SU_val") {
    updates["chem.hba1c_CU_val"] = formatNumber(numeric * HBA1C_SLOPE + HBA1C_OFFSET);
    return updates;
  }

  const conversion = CHEM_CONVERSIONS.find((c) => c.fromKey === key);
  if (!conversion) return updates;

  const override = sex === "FEMALE" ? FEMALE_CONVERSION_OVERRIDES[key] : undefined;
  const factor = override ?? conversion.factor;
  updates[conversion.toKey] = formatNumber(numeric * factor);
  return updates;
};

const computeChemFlag = (key: string, rawValue: string, sex?: Sex | null) => {
  const trimmed = rawValue.trim();
  if (!trimmed) return "";
  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric)) return "";

  const isFemale = sex === "FEMALE";

  if (key === "chem.fbs_CU_val") {
    if (numeric < 60) return "L";
    if (numeric > 100) return "H";
    return "";
  }
  if (key === "chem.fbs_SU_val") {
    if (numeric < 3.5) return "L";
    if (numeric > 5.5) return "H";
    return "";
  }
  if (key === "chem.rbs_CU_val") {
    if (numeric >= 200) return "H";
    return "";
  }
  if (key === "chem.rbs_SU_val") {
    if (numeric >= 11.1) return "H";
    return "";
  }
  if (key === "chem.tc_CU_val") {
    if (numeric < 0) return "L";
    if (numeric > 200.77) return "H";
    return "";
  }
  if (key === "chem.tc_SU_val") {
    if (numeric < 0) return "L";
    if (numeric > 5.2) return "H";
    return "";
  }
  if (key === "chem.hdl_CU_val") {
    if (numeric < (isFemale ? 44.2 : 34.6)) return "L";
    return "";
  }
  if (key === "chem.hdl_SU_val") {
    if (numeric < (isFemale ? 1.15 : 0.9)) return "L";
    return "";
  }
  if (key === "chem._ldl_CU_val") {
    if (numeric < 0) return "L";
    if (numeric > 99.6) return "H";
    return "";
  }
  if (key === "chem.ldl_SU_val") {
    if (numeric < 0) return "L";
    if (numeric > 2.59) return "H";
    return "";
  }
  if (key === "chem.vldl_CU_val") {
    if (numeric < 1.9) return "L";
    if (numeric > 30.76) return "H";
    return "";
  }
  if (key === "chem.vldl_SU_val") {
    if (numeric < 0.05) return "L";
    if (numeric > 0.8) return "H";
    return "";
  }
  if (key === "chem.tri_val") {
    if (numeric < 0) return "L";
    if (numeric > 203.54) return "H";
    return "";
  }
  if (key === "chem.tri_SU_val") {
    if (numeric < 0) return "L";
    if (numeric > 2.3) return "H";
    return "";
  }
  if (key === "chem.crea_CU_val") {
    if (numeric < (isFemale ? 0.5 : 0.8)) return "L";
    if (numeric > (isFemale ? 0.9 : 1.3)) return "H";
    return "";
  }
  if (key === "chem.crea_SU_val") {
    if (numeric < (isFemale ? 44 : 70)) return "L";
    if (numeric > (isFemale ? 80 : 115)) return "H";
    return "";
  }
  if (key === "chem.bun_CU_val") {
    if (numeric < 16.87) return "L";
    if (numeric > 43.37) return "H";
    return "";
  }
  if (key === "chem.bun_SU_val") {
    if (numeric < 2.8) return "L";
    if (numeric > 7.2) return "H";
    return "";
  }
  if (key === "chem.bua_CU_val") {
    if (numeric < (isFemale ? 2.3 : 3.6)) return "L";
    if (numeric > (isFemale ? 6.1 : 8.2)) return "H";
    return "";
  }
  if (key === "chem.bua_SU_val") {
    if (numeric < (isFemale ? 137 : 214)) return "L";
    if (numeric > (isFemale ? 363 : 488)) return "H";
    return "";
  }
  if (key === "chem.sgpt_CU_val" || key === "chem.sgpt_SU_val") {
    if (numeric < 0) return "L";
    if (numeric > (isFemale ? 34 : 45)) return "H";
    return "";
  }
  if (key === "chem.sgot_CU_val" || key === "chem.sgot_SU_val") {
    if (numeric < 0) return "L";
    if (numeric > (isFemale ? 31 : 35)) return "H";
    return "";
  }
  if (key === "chem.tb_CU_val") {
    if (numeric < 0.1) return "L";
    if (numeric > 1.2) return "H";
    return "";
  }
  if (key === "chem.tb_SU_val") {
    if (numeric < 2) return "L";
    if (numeric > 21) return "H";
    return "";
  }
  if (key === "chem.db_CU_val") {
    if (numeric < 0) return "L";
    if (numeric > 0.3) return "H";
    return "";
  }
  if (key === "chem.db_SU_val") {
    if (numeric < 0) return "L";
    if (numeric > 5.13) return "H";
    return "";
  }
  if (key === "chem.ib_CU_val") {
    if (numeric < 0.2) return "L";
    if (numeric > 1.2) return "H";
    return "";
  }
  if (key === "chem.ib_SU_val") {
    if (numeric < 3.42) return "L";
    if (numeric > 20.52) return "H";
    return "";
  }
  if (key === "chem.ggt_CU_val" || key === "chem.ggt_SU_val") {
    if (numeric < (isFemale ? 9 : 11)) return "L";
    if (numeric > (isFemale ? 39 : 61)) return "H";
    return "";
  }
  if (key === "chem.alp_CU_val" || key === "chem.alp_SU_val") {
    if (numeric < 30) return "L";
    if (numeric > 120) return "H";
    return "";
  }
  if (key === "chem.hba1c_CU_val") {
    if (numeric < 4.5) return "L";
    if (numeric > 6.5) return "H";
    return "";
  }
  if (key === "chem.hba1c_SU_val") {
    if (!isFemale) return "";
    if (numeric < 25.67) return "L";
    if (numeric > 47.53) return "H";
    return "";
  }
  return "";
};

const applyFlagToggles = (ctx: InputRuleContext, nextValues: ValuesMap): ValuesMap => {
  const updates: ValuesMap = {};
  for (const valueKey of Object.keys(FLAG_KEYS_BY_VALUE)) {
    const flagKeys = FLAG_KEYS_BY_VALUE[valueKey];
    const flagValue = computeChemFlag(valueKey, nextValues[valueKey] ?? "", ctx.sex);
    for (const flagKey of flagKeys) {
      updates[flagKey] = flagValue;
    }
  }

  return updates;
};

const applyDerivedValues = (ctx: InputRuleContext, nextValues: ValuesMap): ValuesMap => {
  const updates: ValuesMap = {};
  const derivedKeys = new Set([
    "chem.tb_CU_val",
    "chem.tb_SU_val",
    "chem.db_CU_val",
    "chem.db_SU_val",
  ]);

  if (!derivedKeys.has(ctx.key)) return updates;

  const tbSi = parseNumber(nextValues["chem.tb_SU_val"])
    ?? (parseNumber(nextValues["chem.tb_CU_val"]) !== null
      ? (parseNumber(nextValues["chem.tb_CU_val"]) as number) * BILI_CONVERSION
      : null);
  const dbSi = parseNumber(nextValues["chem.db_SU_val"])
    ?? (parseNumber(nextValues["chem.db_CU_val"]) !== null
      ? (parseNumber(nextValues["chem.db_CU_val"]) as number) * BILI_CONVERSION
      : null);

  if (tbSi === null || dbSi === null) {
    updates["chem.ib_SU_val"] = "";
    updates["chem.ib_CU_val"] = "";
    return updates;
  }

  const ibSi = tbSi - dbSi;
  updates["chem.ib_SU_val"] = formatNumber(ibSi);
  updates["chem.ib_CU_val"] = formatNumber(ibSi / BILI_CONVERSION);
  return updates;
};

export function applyInputRules(ctx: InputRuleContext): ValuesMap {
  const conversionUpdates = applyConversions(ctx);
  const baseValues = {
    ...ctx.values,
    [ctx.key]: ctx.value,
    ...conversionUpdates,
  };
  const derivedUpdates = applyDerivedValues(ctx, baseValues);
  const nextValues = {
    ...baseValues,
    ...derivedUpdates,
  };
  return {
    [ctx.key]: ctx.value,
    ...conversionUpdates,
    ...derivedUpdates,
    ...applyFlagToggles(ctx, nextValues),
  };
}
