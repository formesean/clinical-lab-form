import type { FormType } from "@prisma/client";
import z from "zod";

export type FieldKind = "number" | "text" | "combobox" | "rel_abs" | "id_res" | "id_id_res" | "id_id_remarks_remarks";

/** Component type for each input: decimal (number), combobox, or textarea */
export type InputKind = "number" | "combobox" | "text";

/** Single-input field: kind is the component type (number | combobox | text) */
export type SingleFieldConfig = {
  key: string;
  label: string;
  kind: InputKind;
  options?: string[];
};

/** Two inputs in one row. inputKinds: [first, second]; when omitted, derived from kind (rel_abs → [number, number], id_res → [combobox, combobox] or secondInputKind). */
export type TwoFieldConfig = {
  keys: [string, string];
  label: string;
  kind: "rel_abs" | "id_res";
  subLabels?: [string, string];
  inputKinds?: [InputKind, InputKind];
  options?: [string[], string[]];
  secondInputKind?: "combobox" | "text";
};

/** Three inputs in one row. inputKinds: [first, second, third]; default [combobox, combobox, combobox]. */
export type ThreeFieldConfig = {
  keys: [string, string, string];
  label: string;
  kind: "id_id_res";
  subLabels?: [string, string, string];
  inputKinds?: [InputKind, InputKind, InputKind];
  options?: [string[], string[], string[]];
};

/** Four inputs in one row. inputKinds: [first, second, third, fourth]; default [combobox, combobox, combobox, combobox]. */
export type FourFieldConfig = {
  keys: [string, string, string, string];
  label: string;
  kind: "id_id_remarks_remarks";
  subLabels?: [string, string, string, string];
  inputKinds?: [InputKind, InputKind, InputKind, InputKind];
  options?: [string[], string[], string[], string[]];
};

/** Default inputKinds for two-field (when inputKinds not set). */
export function getDefaultInputKindsTwo(f: TwoFieldConfig): [InputKind, InputKind] {
  if (f.inputKinds) return f.inputKinds;
  if (f.kind === "rel_abs") return ["number", "number"];
  return f.secondInputKind === "text" ? ["combobox", "text"] : ["combobox", "combobox"];
}

/** Default inputKinds for three-field (when inputKinds not set). */
export function getDefaultInputKindsThree(_f: ThreeFieldConfig): [InputKind, InputKind, InputKind] {
  return _f.inputKinds ?? ["combobox", "combobox", "combobox"];
}

/** Default inputKinds for four-field (when inputKinds not set). */
export function getDefaultInputKindsFour(_f: FourFieldConfig): [InputKind, InputKind, InputKind, InputKind] {
  return _f.inputKinds ?? ["combobox", "combobox", "combobox", "combobox"];
}

export type FieldConfig = SingleFieldConfig | TwoFieldConfig | ThreeFieldConfig | FourFieldConfig;

export function isRelAbsField(f: FieldConfig): f is TwoFieldConfig {
  return f.kind === "rel_abs";
}

export function isIdResField(f: FieldConfig): f is TwoFieldConfig {
  return f.kind === "id_res";
}

export function isTwoFieldConfig(f: FieldConfig): f is TwoFieldConfig {
  return "keys" in f && f.kind !== "id_id_res" && f.kind !== "id_id_remarks_remarks";
}

export function isThreeFieldConfig(f: FieldConfig): f is ThreeFieldConfig {
  return f.kind === "id_id_res";
}

export function isFourFieldConfig(f: FieldConfig): f is FourFieldConfig {
  return f.kind === "id_id_remarks_remarks";
}

export type FormSchemaConfig = {
  schema: z.ZodObject<z.ZodRawShape>;
  fields: FieldConfig[];
};

const rmt = ["RICO JAMES R. GARGAR, RMT", "PHILL JUSTIN G. GALAROZA, RMT", "RAMON BRYAN A. ABELLA, RMT", "LEYSAM C. BANTILO, RMT", "RHIAN JESS E. CANILLAS, RMT"];
const crystals = ["URIC ACID", "AMORPHOUS URATES", "CALCIUM OXALATE", "AMORPHOUS PHOSPHATES", "CALCIUM PHOSPHATE", "TRIPLE PHOSPHATE", "AMMONIUM BIURATE", "MONOSODIUM URATE", "CALCIUM CARBONATE", "CYSTINE", "CHOLESTEROL", "LEUCINE", "TYROSINE", "BILIRUBIN", "ACETYLSULFADIAZINE", "ACETYLSULFAMETHOXAZOLE", "SULFADIAZINE", "RADIOGRAPHIC DYE", "AMPICILLIN", "HEMATIN", "HEMOSIDERIN", "HIPPURIC ACID", "INDIGOTIN", "CALCIUM HYDROGEN PHOSPHATE", "XANTHINE"];
const parasitesID = ["NONE", "FLAGELLATES", "Giardia duodenalis", "Chilomastix mesnili", "Pentatrichomonas hominis", "Enteromonas hominis", "Retortamonas intestinalis", "AMOEBAE", "Entamoeba histolytica", "Entamoeba coli", "Endolimax nana", "Entamoeba hartmanni", "Entamoeba polecki", "Iodamoeba buetschlii", "Dientamoeba fragilis", "SPOROZOA", "Balantidium coli", "Cystoisospora belli", "Sarcocystis hominis", "Sarcocystis suihominis", "Cryptosporidium spp.", "Blastocystis hominis", "TREMATODA", "Schistosoma mansoni", "Schistosoma japonicum", "Schistosoma haematobium", "Schistosoma intercalatum", "Schistosoma mekongi", "Faciolopsis buski", "Echinostoma ilocanum", "Clonorchis sinensis", "Opisthorchis spp.", "Heterophyes heterophyes", "Metagonimus yokogawai", "Paragonimus westermani", "Fasciola hepatica"];
const parasiteRemarks = ["TROPHOZOITE", "CYST", "ADULT-MALE", "ADULT-FEMALE", "RHABDITOID LARVA", "FILARIFORM LARVA", "MICROFILARIA", "OVUM", "OVUM-FERTILIZED", "OVUM-UNFERTILIZED", "OVUM-DECORTICATED", "OVUM-EMBRYONATED", "CYSTICERCUS CELLULOSAE", "SPOROCYST", "CERCARIA", "MIRACIDIUM", "REDIA"];
const REL_ABS_LABELS: [string, string] = ["Relative", "Absolute"];
const ID_RES_LABELS: [string, string] = ["ID", "Result"];
const ID_REMARKS_LABELS: [string, string] = ["ID", "Remarks"];
const ID_ID_RES_LABELS: [string, string, string] = ["ID 1", "ID 2", "Result"];
const ID_ID_REMARKS_REMARKS_LABELS: [string, string, string, string] = ["ID 1", "ID 2", "Remarks 1", "Remarks 2"];

const chemSchema = z.object({
  fbs: z.number().optional(),
  rbs: z.number().optional(),
  tc: z.number().optional(),
  hdl: z.number().optional(),
  ldl: z.number().optional(),
  vldl: z.number().optional(),
  triglycerdes: z.number().optional(),
  creatinine: z.number().optional(),
  bun: z.number().optional(),
  bua: z.number().optional(),
  sgpt_alt: z.number().optional(),
  sgot_ast: z.number().optional(),
  ttl_br: z.number().optional(),
  dir_br: z.number().optional(),
  ind_br: z.number().optional(),
  gtt: z.number().optional(),
  alp: z.number().optional(),
  hba1c: z.number().optional(),
  remarks: z.string().optional(),
  performed: z.string().optional(),
});

const chemFields: FieldConfig[] = [
  { key: "fbs", label: "Fasting Blood Sugar (FBS):", kind: "number" },
  { key: "rbs", label: "Random Blood Sugar (RBS):", kind: "number" },
  { key: "tc", label: "Total Cholesterol (TC):", kind: "number" },
  { key: "hdl", label: "HDL:", kind: "number" },
  { key: "ldl", label: "LDL:", kind: "number" },
  { key: "vldl", label: "VLDL:", kind: "number" },
  { key: "triglycerdes", label: "Triglycerides:", kind: "number" },
  { key: "creatinine", label: "Creatinine:", kind: "number" },
  { key: "bun", label: "BUN:", kind: "number" },
  { key: "bua", label: "BUA:", kind: "number" },
  { key: "sgpt_alt", label: "SGPT/ALT:", kind: "number" },
  { key: "sgot_ast", label: "SGOT/AST:", kind: "number" },
  { key: "ttl_br", label: "Total Bilirubin:", kind: "number" },
  { key: "dir_br", label: "Direct Bilirubin:", kind: "number" },
  { key: "ind_br", label: "Indirect Bilirubin:", kind: "number" },
  { key: "gtt", label: "GTT:", kind: "number" },
  { key: "alp", label: "ALP:", kind: "number" },
  { key: "hba1c", label: "HbA1c:", kind: "number" },
  { key: "remarks", label: "Remarks:", kind: "text" },
  { key: "performed", label: "Performed:", kind: "combobox", options: rmt },
];

const ogttSchema = z.object({
  fbs: z.number().optional(),
  first_hour: z.number().optional(),
  second_hour: z.number().optional(),
  hba1c: z.number().optional(),
  remarks: z.string().optional(),
  performed: z.string().optional(),
});

const ogttFields: FieldConfig[] = [
  { key: "fbs", label: "Fasting Blood Sugar (FBS):", kind: "number" },
  { key: "first_hour", label: "First Hour:", kind: "number" },
  { key: "second_hour", label: "Second Hour:", kind: "number" },
  { key: "hba1c", label: "HbA1c:", kind: "number" },
  { key: "remarks", label: "Remarks:", kind: "text" },
  { key: "performed", label: "Performed:", kind: "combobox", options: rmt },
];

const cbcSchema = z.object({
  wbc: z.number().optional(),
  rbc: z.number().optional(),
  hemoglobin: z.number().optional(),
  hemotocrit: z.number().optional(),
  mcv: z.number().optional(),
  mch: z.number().optional(),
  mchc: z.number().optional(),
  rdw: z.number().optional(),
  pc: z.number().optional(),
  mpv: z.number().optional(),
  neutrophil_rel: z.number().optional(),
  neutrophil_abs: z.number().optional(),
  lymphocyte_rel: z.number().optional(),
  lymphocyte_abs: z.number().optional(),
  monocyte_rel: z.number().optional(),
  monocyte_abs: z.number().optional(),
  eosinophil_rel: z.number().optional(),
  eosinophil_abs: z.number().optional(),
  basophil_rel: z.number().optional(),
  basophil_abs: z.number().optional(),
  ig_rel: z.number().optional(),
  ig_abs: z.number().optional(),
  remarks: z.string().optional(),
  performed: z.string().optional(),
});

const cbcFields: FieldConfig[] = [
  { key: "wbc", label: "White Blood Cells (WBC):", kind: "number" },
  { key: "rbc", label: "Red Blood Cells (RBC):", kind: "number" },
  { key: "hemoglobin", label: "Hemoglobin:", kind: "number" },
  { key: "hemotocrit", label: "Hemotocrit:", kind: "number" },
  { key: "mcv", label: "MCV:", kind: "number" },
  { key: "mch", label: "MCH:", kind: "number" },
  { key: "mchc", label: "MCHC:", kind: "number" },
  { key: "rdw", label: "RDW:", kind: "number" },
  { key: "pc", label: "Platelet Count:", kind: "number" },
  { key: "mpv", label: "MPV:", kind: "number" },
  { keys: ["neutrophil_rel", "neutrophil_abs"], label: "Neutrophil:", kind: "rel_abs", subLabels: REL_ABS_LABELS },
  { keys: ["lymphocyte_rel", "lymphocyte_abs"], label: "Lymphocyte:", kind: "rel_abs", subLabels: REL_ABS_LABELS },
  { keys: ["monocyte_rel", "monocyte_abs"], label: "Monocyte:", kind: "rel_abs", subLabels: REL_ABS_LABELS },
  { keys: ["eosinophil_rel", "eosinophil_abs"], label: "Eosinophil:", kind: "rel_abs", subLabels: REL_ABS_LABELS },
  { keys: ["basophil_rel", "basophil_abs"], label: "Basophil:", kind: "rel_abs", subLabels: REL_ABS_LABELS },
  { keys: ["ig_rel", "ig_abs"], label: "Immature Granulocyte:", kind: "rel_abs", subLabels: REL_ABS_LABELS },
  { key: "remarks", label: "Remarks:", kind: "text" },
  { key: "performed", label: "Performed:", kind: "combobox", options: rmt },
];

const btSchema = z.object({
  abo: z.string().optional(),
  rh: z.string().optional(),
  remarks: z.string().optional(),
  performed: z.string().optional(),
});

const btFields: FieldConfig[] = [
  { key: "abo", label: "ABO:", kind: "combobox", options: ["A", "B", "AB", "O"] },
  { key: "rh", label: "Rh:", kind: "combobox", options: ["POSITIVE", "NEGATIVE"] },
  { key: "remarks", label: "Remarks:", kind: "text" },
  { key: "performed", label: "Performed:", kind: "combobox", options: rmt },
];

const uaSchema = z.object({
  color_id: z.string().optional(),
  color_result: z.string().optional(),
  clarity_id: z.string().optional(),
  clarity_result: z.string().optional(),
  leukocytes_id: z.string().optional(),
  leukocytes_result: z.string().optional(),
  nitrite_id: z.string().optional(),
  nitrite_result: z.string().optional(),
  urobilinogen_id: z.string().optional(),
  urobilinogen_result: z.string().optional(),
  protein_id: z.string().optional(),
  protein_result: z.string().optional(),
  ph_id: z.string().optional(),
  ph_result: z.string().optional(),
  blood_id: z.string().optional(),
  blood_result: z.string().optional(),
  spec_grav_id: z.string().optional(),
  spec_grav_result: z.string().optional(),
  ketones_id: z.string().optional(),
  ketones_result: z.string().optional(),
  bilirubin_id: z.string().optional(),
  bilirubin_result: z.string().optional(),
  glucose_id: z.string().optional(),
  glucose_result: z.string().optional(),
  wbc_id: z.string().optional(),
  wbc_result: z.string().optional(),
  rbc_id: z.string().optional(),
  rbc_result: z.string().optional(),
  epithelial_cells_id: z.string().optional(),
  epithelial_cells_res: z.string().optional(),
  mucus_threads_id: z.string().optional(),
  mucus_threads_result: z.string().optional(),
  cast_id: z.string().optional(),
  cast_result: z.string().optional(),
  bacteria_id: z.string().optional(),
  bacteria_result: z.string().optional(),
  yeast_id: z.string().optional(),
  yeast_res: z.string().optional(),
  parasite_id: z.string().optional(),
  parasite_res: z.string().optional(),
  crystal_id1: z.string().optional(),
  crystal_id2: z.string().optional(),
  crystal_res1: z.string().optional(),
  crystal_res2: z.string().optional(),
  others_id: z.string().optional(),
  others_res: z.string().optional(),
  remarks: z.string().optional(),
  performed: z.string().optional(),
});

const uaFields: FieldConfig[] = [
  { keys: ["color_id", "color_result"], label: "Color:", kind: "id_res", subLabels: ID_RES_LABELS, inputKinds: ["text", "combobox"], options: [[], ["COLORLESS", "LIGHT YELLOW", "YELLOW", "DARK YELLOW", "YELLOW-ORANGE", "YELLOW-GREEN", "YELLOW-BROWN", "ORANGE-BROWN", "LIGHT RED", "RED", "DARK RED", "RED-ORANGE", "RED-PURPLE", "RED-BROWN", "DARK BROWN", "BROWN-BLACK", "BLACK", "BLUE-GREEN", "GREEN-BROWN"]] },
  { keys: ["clarity_id", "clarity_result"], label: "Clarity:", kind: "id_res", subLabels: ID_RES_LABELS, inputKinds: ["text", "combobox"], options: [[], ["CLEAR", "SLIGHTLY CLOUDY", "CLOUDY", "TURBID", "MILKY"]] },
  { keys: ["leukocytes_id", "leukocytes_result"], label: "Leukocytes:", kind: "id_res", subLabels: ID_RES_LABELS, inputKinds: ["text", "combobox"], options: [[], ["NEGATIVE", "25 (+)", "75 (++)", "500 (+++)"]] },
  { keys: ["nitrite_id", "nitrite_result"], label: "Nitrite:", kind: "id_res", subLabels: ID_RES_LABELS, inputKinds: ["text", "combobox"], options: [[], ["NEGATIVE", " TRACE (+/-)", ">0.5 (+)"]] },
  { keys: ["urobilinogen_id", "urobilinogen_result"], label: "Urobilinogen:", kind: "id_res", subLabels: ID_RES_LABELS, inputKinds: ["text", "combobox"], options: [[], ["0.1 (NORMAL)", "1.0 (NORMAL)", "4.0 (++)", "8.0 (+++)", "12.0 (++++)"]] },
  { keys: ["protein_id", "protein_result"], label: "Protein:", kind: "id_res", subLabels: ID_RES_LABELS, inputKinds: ["text", "combobox"], options: [[], ["NEGATIVE", "10 (+/-)", "30 (+)", "100 (++)", "300 (+++)", "1000 (++++)"]] },
  { keys: ["ph_id", "ph_result"], label: "pH:", kind: "id_res", subLabels: ID_RES_LABELS, inputKinds: ["text", "combobox"], options: [[], ["5.0", "6.0", "6.5", "7.0", "7.5", "8.0", "9.0"]] },
  { keys: ["blood_id", "blood_result"], label: "Blood:", kind: "id_res", subLabels: ID_RES_LABELS, inputKinds: ["combobox", "combobox"], options: [["(NON-HEMOLYSED)", "(HEMOLYSED)"], ["NEGATIVE", "10 (+)", "50 (++)", "250 (+++)"]] },
  { keys: ["spec_grav_id", "spec_grav_result"], label: "Specific Gravity:", kind: "id_res", subLabels: ID_RES_LABELS, inputKinds: ["text", "combobox"], options: [[], ["1.000", "1.005", "1.010", "1.015", "1.020", "1.025", "1.030"]] },
  { keys: ["ketones_id", "ketones_result"], label: "Ketones:", kind: "id_res", subLabels: ID_RES_LABELS, inputKinds: ["text", "combobox"], options: [[], ["NEGATIVE", "5 (+/-)", "10 (+)", "50 (++)", "100 (+++)"]] },
  { keys: ["bilirubin_id", "bilirubin_result"], label: "Blirubin:", kind: "id_res", subLabels: ID_RES_LABELS, inputKinds: ["text", "combobox"], options: [[], ["NEGATIVE", "0.5 (+)", "1.0 (++)", "3.0 (+++)"]] },
  { keys: ["glucose_id", "glucose_result"], label: "Bilirubin:", kind: "id_res", subLabels: ID_RES_LABELS, inputKinds: ["text", "combobox"], options: [[], ["NEGATIVE", "100 (+/-)", "250 (+)", "500 (++)", "1000 (+++)", "2000 (++++)"]] },
  { keys: ["wbc_id", "wbc_result"], label: "White Blood Cells (WBC):", kind: "id_res", subLabels: ID_RES_LABELS, inputKinds: ["text", "text"] },
  { key: "rbc", label: "Red Blood Cells (RBC):", kind: "combobox", options: ["Isotonic", "Hypotonic", "Crenated", "Microcytic", "Dysmorphic"] },
  { keys: ["epithelial_cells_id", "epithelial_cells_res"], label: "Epithelial Cells:", kind: "id_res", subLabels: ID_RES_LABELS, inputKinds: ["combobox", "combobox"], options: [["Squamous", "Transitional", "Renal Tubular", "Oval Fat Body"], ["NONE", "RARE", "FEW", "MODERATE", "MANY", "ABUNDANT"]] },
  { keys: ["mucus_threads_id", "mucus_threads_result"], label: "Mucus Threads:", kind: "id_res", subLabels: ID_RES_LABELS, inputKinds: ["text", "combobox"], options: [[], ["NONE", "RARE", "FEW", "MODERATE", "MANY", "ABUNDANT"]] },
  { key: "cast", label: "Cast:", kind: "combobox", options: ["Hyaline", "RBC", "WBC", "Bacterial", "Epithelial Cell", "Fatty", "Mixed Cellular", "Granular", "Waxy", "Broad"] },
  { keys: ["bacteria_id", "bacteria_result"], label: "Bacteria:", kind: "id_res", subLabels: ID_RES_LABELS, inputKinds: ["text", "combobox"], options: [[], ["NONE", "RARE", "FEW", "MODERATE", "MANY", "ABUNDANT"]] },
  { keys: ["yeast_id", "yeast_res"], label: "Yeast:", kind: "id_res", subLabels: ID_RES_LABELS, inputKinds: ["combobox", "combobox"], options: [["Budding", "Hyphenated"], ["NONE", "RARE", "FEW", "MODERATE", "MANY", "ABUNDANT"]] },
  { keys: ["parasite_id", "parasite_res"], label: "Parasite:", kind: "id_res", subLabels: ID_RES_LABELS, inputKinds: ["combobox", "combobox"], options: [["T. vaginalis (troph.)", "S. haematobium (ova)", "E. histolytica"], ["NONE", "RARE", "FEW", "MODERATE", "MANY", "ABUNDANT"]] },
  { keys: ["crystal_id1", "crystal_id2", "crystal_res1", "crystal_res2"], label: "Crystals:", kind: "id_id_remarks_remarks", subLabels: ["ID (HPF)", "Result (HPF)", "ID (LPF)", "Result (LPF)"], inputKinds: ["combobox", "combobox", "combobox", "text"], options: [crystals, ["NONE", "RARE", "FEW", "MODERATE", "MANY", "ABUNDANT"], crystals, []] },
  { keys: ["others_id", "others_res"], label: "Others:", kind: "id_res", subLabels: ID_RES_LABELS, inputKinds: ["combobox", "combobox"], options: [["FAT GLOBULES", "TUMOR CELLS", "VIRAL INCLUSION CELLS", "PLATELETS"], ["NONE", "RARE", "FEW", "MODERATE", "MANY", "ABUNDANT"]] },
  { key: "remarks", label: "Remarks:", kind: "text" },
  { key: "performed", label: "Performed:", kind: "combobox", options: rmt },
];

const seSchema = z.object({
  color_result: z.string().optional(),
  color_id: z.string().optional(),
  color_remarks: z.string().optional(),
  consistency_result: z.string().optional(),
  consistency_id: z.string().optional(),
  consistency_remarks: z.string().optional(),
  pm_result: z.string().optional(),
  pm_id: z.string().optional(),
  pm_remarks: z.string().optional(),
  rbc_result: z.string().optional(),
  rbc_id: z.string().optional(),
  rbc_remarks: z.string().optional(),
  wbc_result: z.string().optional(),
  wbc_id: z.string().optional(),
  wbc_remarks: z.string().optional(),
  bacteria_result: z.string().optional(),
  bacteria_id: z.string().optional(),
  bacteria_remarks: z.string().optional(),
  yeast_result: z.string().optional(),
  yeast_id: z.string().optional(),
  yeast_remarks: z.string().optional(),
  parasite_result1: z.string().optional(),
  parasite_result2: z.string().optional(),
  parasite_id1: z.string().optional(),
  parasite_id2: z.string().optional(),
  parasite_remarks1: z.string().optional(),
  parasite_remarks2: z.string().optional(),
  others_result: z.string().optional(),
  others_id: z.string().optional(),
  others_remarks: z.string().optional(),
  remarks: z.string().optional(),
  performed: z.string().optional(),
});

const seFields: FieldConfig[] = [
  { keys: ["color_result", "color_id", "color_remarks"], label: "Color:", kind: "id_id_res", subLabels: ["Result", "ID", "Remarks"], inputKinds: ["combobox", "text", "text"], options: [["DARK BROWN", "BROWN", "LIGHT BROWN", "YELLOWISH-BROWN", "GREENISH-BROWN", "REDDISH-BROWN", "DARK BROWN W/ RED STREAKS", "BROWN W/ RED STREAKS", "LIGHT BROWN W/ RED STREAKS", "YELLOW", "GREEN", "RED", "PALE YELLOW", "GRAY", "WHITE", "BLACK"], [], []] },
  { keys: ["consistency_result", "consistency_id", "consistency_remarks"], label: "Consistency:", kind: "id_id_res", subLabels: ["Result", "ID", "Remarks"], inputKinds: ["combobox", "text", "text"], options: [["FORMED", "SOFT", "WATERY", "MUCOID", "BULKY & FROTHY", "PASTY"], [], []] },
  { keys: ["pm_result", "pm_id", "pm_remarks"], label: "Parasites (Macroscopic):", kind: "id_id_res", subLabels: ["Result", "ID", "Remarks"], inputKinds: ["text", "combobox", "combobox"], options: [[], ["NONE", "NEMATODA", "Enterobius vermicularis", "Ascaris lumbricoides", "Trichuris trichiura", "Ancylostoma duodenale", "Necator americanus", "Trichinella spiralis", "Capillaria philippinensis", "Capillaria hepatica", "Strongyloides stercoralis", "CESTODA", "Adenocephalus pacificus", "Echinococcus granulosus", "Dibothriocephalus latus", "Dipylidium caninum", "Hymenolepis diminuta", "Hymenolepis nana", "Taenia saginata", "Taenia solium"], ["PROGLOTTID-IMMATURE", "PROGLOTTID-MATURE", "PROGLOTTID-GRAVID", "SCOLEX", "ADULT", "RHABDITOID LARVA", "FILARIFORM LARVA", "SPARGANUM"]] },
  { keys: ["rbc_result", "rbc_id", "rbc_remarks"], label: "Red Blood Cells (RBC):", kind: "id_id_res", subLabels: ["Result", "ID", "Remarks"], inputKinds: ["text", "text", "text"], options: [[], [], []] },
  { keys: ["wbc_result", "wbc_id", "wbc_remarks"], label: "White Blood Cells (WBC):", kind: "id_id_res", subLabels: ["Result", "ID", "Remarks"], inputKinds: ["text", "text", "text"], options: [[], [], []] },
  { keys: ["bacteria_result", "bacteria_id", "bacteria_remarks"], label: "Bacteria:", kind: "id_id_res", subLabels: ["Result", "ID", "Remarks"], inputKinds: ["text", "text", "text"], options: [[], [], []] },
  { keys: ["yeast_result", "yeast_id", "yeast_remarks"], label: "Yeast:", kind: "id_id_res", subLabels: ["Result", "ID", "Remarks"], inputKinds: ["text", "combobox", "combobox"], options: [[], ["NONE", "BUDDING", "HYPHENATED"], ["NONE", "BUDDING", "HYPHENATED"]] },
  { keys: ["parasite_result1", "parasite_id1", "parasite_remarks1"], label: "Parasite/s:", kind: "id_id_res", subLabels: ["Result 1", "ID 1", "Remarks 1"], inputKinds: ["text", "combobox", "combobox"], options: [[], parasitesID, parasiteRemarks] },
  { keys: ["parasite_result2", "parasite_id2", "parasite_remarks2"], label: "", kind: "id_id_res", subLabels: ["Result 2", "ID 2", "Remarks 2"], inputKinds: ["text", "combobox", "combobox"], options: [[], parasitesID, parasiteRemarks] },
  { keys: ["others_result", "others_id", "others_remarks"], label: "Others:", kind: "id_id_res", subLabels: ["Result", "ID", "Remarks"], inputKinds: ["text", "combobox", "text"], options: [[], ["NONE", "FAT GLOBULE", "MEAT FIBER", "VEGETABLE FIBER", "STARCH GRANULES", "EPITHELIAL CELL", "CALCIUM OXALATE CRYSTAL", "TRIPLE PHOSPHATE CRYSTAL", "FATTY ACID CRYSTAL", "CHARCOAL LEYDEN CRYSTAL", "HEMATOIDIN CRYSTAL"], []] },
  { key: "remarks", label: "Remarks:", kind: "text" },
  { key: "performed", label: "Performed:", kind: "combobox", options: rmt },
];

const ptSchema = z.object({
  color: z.string().optional(),
  clarity: z.string().optional(),
  ph: z.string().optional(),
  spec_grav: z.string().optional(),
  b_hcg: z.string().optional(),
  remarks: z.string().optional(),
  performed: z.string().optional(),
});

const ptFields: FieldConfig[] = [
  { key: "color", label: "Color:", kind: "combobox", options: ["COLORLESS", "LIGHT YELLOW", "YELLOW", "DARK YELLOW", "YELLOW-ORANGE", "YELLOW-GREEN", "YELLOW-BROWN", "ORANGE-BROWN", "LIGHT RED", "RED", "DARK RED", "RED-ORANGE", "RED-PURPLE", "RED-BROWN", "DARK BROWN", "BROWN-BLACK", "BLACK", "BLUE-GREEN", "GREEN-BROWN"] },
  { key: "clarity", label: "Clarity:", kind: "combobox", options: ["CLEAR", "SLIGHTLY CLOUDY", "CLOUDY", "TURBID", "MILKY"] },
  { key: "ph", label: "pH:", kind: "combobox", options: ["5.0", "6.0", "6.5", "7.0", "7.5", "8.0", "9.0"] },
  { key: "spec_grav", label: "Specific Gravity:", kind: "combobox", options: ["1.000", "1.005", "1.010", "1.015", "1.020", "1.025", "1.030"] },
  { key: "b_hcg", label: "β-hCG:", kind: "combobox", options: ["POSITIVE", "NEGATIVE"] },
  { key: "remarks", label: "Remarks:", kind: "text" },
  { key: "performed", label: "Performed:", kind: "combobox", options: rmt },
];

const obtSchema = z.object({
  color: z.string().optional(),
  consistency: z.string().optional(),
  hhma: z.string().optional(),
  remarks: z.string().optional(),
  performed: z.string().optional(),
});

const obtFields: FieldConfig[] = [
  { key: "color", label: "Color:", kind: "combobox", options: ["DARK BROWN", "BROWN", "LIGHT BROWN", "YELLOWISH-BROWN", "GREENISH-BROWN", "REDDISH-BROWN", "DARK BROWN W/ RED STREAKS", "BROWN W/ RED STREAKS", "LIGHT BROWN W/ RED STREAKS", "YELLOW", "GREEN", "RED", "PALE YELLOW", "GRAY", "WHITE", "BLACK"] },
  { key: "consistency", label: "Consistency:", kind: "combobox", options: ["FORMED", "SOFT", "WATERY", "MUCOID", "BULKY & FROTHY", "PASTY"] },
  { key: "hham", label: "Human Hemoglobin-specific  Monoclonal Antibodies:", kind: "combobox", options: ["POSITIVE", "NEGATIVE"] },
  { key: "remarks", label: "Remarks:", kind: "text" },
  { key: "performed", label: "Performed:", kind: "combobox", options: rmt },
];

const immunoSchema = z.object({
  anti_hiv: z.string().optional(),
  hbsag: z.string().optional(),
  anti_hcv: z.string().optional(),
  anti_tp: z.string().optional(),
  dengue_ns1_ag: z.string().optional(),
  dengue_igm: z.string().optional(),
  dengue_igg: z.string().optional(),
  b_hcg: z.string().optional(),
  remarks: z.string().optional(),
  performed: z.string().optional(),
});

const immunoFields: FieldConfig[] = [
  { key: "anti_hiv", label: "anti - HIV 1/2:", kind: "combobox", options: ["REACTIVE", "NON-REACTIVE"] },
  { key: "hbsag", label: "HBsAb:", kind: "combobox", options: ["REACTIVE", "NON-REACTIVE"] },
  { key: "anti_hcv", label: "anti - HCV:", kind: "combobox", options: ["REACTIVE", "NON-REACTIVE"] },
  { key: "anti_tp", label: "anti - T. pallidum:", kind: "combobox", options: ["REACTIVE", "NON-REACTIVE"] },
  { key: "dengue_ns1_ag", label: "Denge NS1 Ag:", kind: "combobox", options: ["REACTIVE", "NON-REACTIVE"] },
  { key: "dengue_igm", label: "Dengue IgM:", kind: "combobox", options: ["REACTIVE", "NON-REACTIVE"] },
  { key: "dengue_igg", label: "Dengue IgG:", kind: "combobox", options: ["REACTIVE", "NON-REACTIVE"] },
  { key: "b_hcg", label: "β-hCG:", kind: "combobox", options: ["POSITIVE", "NEGATIVE"] },
  { key: "remarks", label: "Remarks:", kind: "text" },
  { key: "performed", label: "Performed:", kind: "combobox", options: rmt },
];

const stubSchema = z.object({
  remarks: z.string().min(0).optional(),
  performed: z.string().min(0).optional(),
});

const stubFields: FieldConfig[] = [
  { key: "remarks", label: "Remarks:", kind: "text" },
  { key: "performed", label: "Performed:", kind: "combobox", options: rmt },
];

const FORM_SCHEMAS: Record<FormType, FormSchemaConfig> = {
  CHEM: { schema: chemSchema, fields: chemFields },
  OGTT: { schema: ogttSchema, fields: ogttFields },
  CBC: { schema: cbcSchema, fields: cbcFields },
  BT: { schema: btSchema, fields: btFields },
  UA: { schema: uaSchema, fields: uaFields },
  SE: { schema: seSchema, fields: seFields },
  PT: { schema: ptSchema, fields: ptFields },
  OBT: { schema: obtSchema, fields: obtFields },
  IMMUNO: { schema: immunoSchema, fields: immunoFields },
  MICRO: { schema: stubSchema, fields: stubFields },
};

export function getFormSchemaConfig(formType: FormType): FormSchemaConfig {
  const config = FORM_SCHEMAS[formType];
  if (!config) {
    throw new Error(`Unknown form type: ${formType}`);
  }
  return config;
}

export function getDefaultValues(formType: FormType): Record<string, unknown> {
  const { fields } = getFormSchemaConfig(formType);
  const entries: [string, unknown][] = [];
  for (const f of fields) {
    if (isFourFieldConfig(f)) {
      entries.push([f.keys[0], ""], [f.keys[1], ""], [f.keys[2], ""], [f.keys[3], ""]);
    } else if (isThreeFieldConfig(f)) {
      entries.push([f.keys[0], ""], [f.keys[1], ""], [f.keys[2], ""]);
    } else if (isTwoFieldConfig(f)) {
      const empty = f.kind === "id_res" ? "" : undefined;
      entries.push([f.keys[0], empty], [f.keys[1], empty]);
    } else if ("key" in f) {
      entries.push([f.key, f.kind === "number" ? undefined : ""]);
    }
  }
  return Object.fromEntries(entries);
}
