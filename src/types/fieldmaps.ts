import type { PatientDTO } from "@/types/api/patients";

export type PatientFieldKey = keyof PatientDTO;
export type PatientFieldmapKey = `patient.${PatientFieldKey}`;

export const CHEM_FIELD_KEYS = [
  "chem._ldl_CU_val",
  "chem.alp_CU_flag",
  "chem.alp_CU_val",
  "chem.alp_SU_flag",
  "chem.alp_SU_val",
  "chem.b_SU_flag",
  "chem.b_SU_val",
  "chem.bua_CU_flag",
  "chem.bua_CU_val",
  "chem.bua_SU_flag",
  "chem.bua_SU_val",
  "chem.bun_CU_flag",
  "chem.bun_CU_val",
  "chem.bun_SU_flag",
  "chem.bun_SU_val",
  "chem.crea_CU_flag",
  "chem.crea_CU_val",
  "chem.crea_SU_flag",
  "chem.crea_SU_val",
  "chem.dateOfReq",
  "chem.datePerf",
  "chem.dateRel",
  "chem.db_CU_flag",
  "chem.db_CU_val",
  "chem.db_SU_flag",
  "chem.db_SU_val",
  "chem.fbs_CU_flag",
  "chem.fbs_CU_val",
  "chem.fbs_SU_flag",
  "chem.fbs_SU_val",
  "chem.ggt_CU_flag",
  "chem.ggt_CU_val",
  "chem.ggt_SU_flag",
  "chem.ggt_SU_val",
  "chem.hba1c_CU_flag",
  "chem.hba1c_CU_val",
  "chem.hba1c_SU_flag",
  "chem.hba1c_SU_val",
  "chem.hdl_CU_flag",
  "chem.hdl_CU_val",
  "chem.hdl_SU_flag",
  "chem.hdl_SU_val",
  "chem.ib_CU_flag",
  "chem.ib_CU_val",
  "chem.labIdNum",
  "chem.ldl_CU_flag",
  "chem.ldl_SU_flag",
  "chem.ldl_SU_val",
  "chem.location",
  "chem.perfByLic",
  "chem.perfByName",
  "chem.rbs_CU_flag",
  "chem.rbs_CU_val",
  "chem.rbs_SU_flag",
  "chem.rbs_SU_val",
  "chem.remarks",
  "chem.sgot_CU_flag",
  "chem.sgot_CU_val",
  "chem.sgot_SU_flag",
  "chem.sgot_SU_val",
  "chem.sgpt_CU_flag",
  "chem.sgpt_CU_val",
  "chem.sgpt_SU_flag",
  "chem.sgpt_SU_val",
  "chem.tb_CU_flag",
  "chem.tb_CU_val",
  "chem.tb_SU_flag",
  "chem.tb_SU_val",
  "chem.tc_CU_flag",
  "chem.tc_CU_val",
  "chem.tc_SU_flag",
  "chem.tc_SU_val",
  "chem.timeOfReq",
  "chem.timePerf",
  "chem.timeRel",
  "chem.tri_CU_flag",
  "chem.tri_SU_flag",
  "chem.tri_SU_val",
  "chem.tri_val",
  "chem.vldl_CU_flag",
  "chem.vldl_CU_val",
  "chem.vldl_SU_flag",
  "chem.vldl_SU_val",
] as const;

export type ChemFieldKey = (typeof CHEM_FIELD_KEYS)[number];
export type ChemFieldmapKey = ChemFieldKey | PatientFieldmapKey;

export const OGTT_FIELD_KEYS = [
  "ogtt.dateOfReq",
  "ogtt.datePerf",
  "ogtt.dateRel",
  "ogtt.fbs_CU_flag",
  "ogtt.fbs_CU_val",
  "ogtt.fbs_SI_flag",
  "ogtt.fbs_SI_val",
  "ogtt.fh_CU_flag",
  "ogtt.fh_CU_val",
  "ogtt.fh_SI_flag",
  "ogtt.fh_SI_val",
  "ogtt.hba1c_CU_flag",
  "ogtt.hba1c_CU_val",
  "ogtt.hba1c_SI_flag",
  "ogtt.hba1c_SI_val",
  "ogtt.labIdNum",
  "ogtt.location",
  "ogtt.perfByLic",
  "ogtt.perfByName",
  "ogtt.remarks",
  "ogtt.sh_CU_flag",
  "ogtt.sh_CU_val",
  "ogtt.sh_SI_flag",
  "ogtt.sh_SI_val",
  "ogtt.timeOfReq",
  "ogtt.timePerf",
  "ogtt.timeRel",
] as const;

export type OgttFieldKey = (typeof OGTT_FIELD_KEYS)[number];
export type OgttFieldmapKey = OgttFieldKey | PatientFieldmapKey;

export const CBC_FIELD_KEYS = [
  "cbc.baso_a_flag",
  "cbc.baso_a_val",
  "cbc.baso_r_flag",
  "cbc.baso_r_val",
  "cbc.dateOfReq",
  "cbc.datePerf",
  "cbc.dateRel",
  "cbc.eosi_a_flag",
  "cbc.eosi_a_val",
  "cbc.eosi_r_flag",
  "cbc.eosi_r_val",
  "cbc.hemato_flag",
  "cbc.hemato_val",
  "cbc.hemoglo_flag",
  "cbc.hemoglo_val",
  "cbc.ig_a_flag",
  "cbc.ig_a_val",
  "cbc.ig_r_flag",
  "cbc.ig_r_val",
  "cbc.labIdNum",
  "cbc.location",
  "cbc.lympho_a_flag",
  "cbc.lympho_a_val",
  "cbc.lympho_r_flag",
  "cbc.lympho_r_val",
  "cbc.mch_flag",
  "cbc.mch_val",
  "cbc.mchc_flag",
  "cbc.mchc_val",
  "cbc.mcv_flag",
  "cbc.mcv_val",
  "cbc.mono_a_flag",
  "cbc.mono_a_val",
  "cbc.mono_r_flag",
  "cbc.mono_r_val",
  "cbc.mpv_flag",
  "cbc.mpv_val",
  "cbc.neutro_a_flag",
  "cbc.neutro_a_val",
  "cbc.neutro_r_flag",
  "cbc.neutro_r_val",
  "cbc.pc_flag",
  "cbc.pc_val",
  "cbc.perfByLic",
  "cbc.perfByName",
  "cbc.rbc_flag",
  "cbc.rbc_val",
  "cbc.rdw_flag",
  "cbc.rdw_val",
  "cbc.remarks",
  "cbc.timeOfReq",
  "cbc.timePerf",
  "cbc.timeRel",
  "cbc.wbc_flag",
  "cbc.wbc_val",
] as const;

export type CbcFieldKey = (typeof CBC_FIELD_KEYS)[number];
export type CbcFieldmapKey = CbcFieldKey | PatientFieldmapKey;

export const BT_FIELD_KEYS = [
  "bt.abo_val",
  "bt.dateOfReq",
  "bt.datePerf",
  "bt.dateRel",
  "bt.labIdNum",
  "bt.location",
  "bt.perfByLic",
  "bt.perfByName",
  "bt.remarks",
  "bt.rh_val",
  "bt.timeOfReq",
  "bt.timePerf",
  "bt.timeRel",
] as const;

export type BtFieldKey = (typeof BT_FIELD_KEYS)[number];
export type BtFieldmapKey = BtFieldKey | PatientFieldmapKey;

export type Fieldmap<K extends string = string> = {
  kind: "pdf" | "image";
  filename?: string;
  meta: {
    scale?: number;
    pageCount: number;
    pages: Array<{ page: number; width: number; height: number }>;
    image?: {
      naturalWidth: number;
      naturalHeight: number;
      renderWidth: number;
      renderHeight: number;
    };
  };
  fields: Array<{
    key: K;
    page: number;
    xPx?: number;
    yPx?: number;
    wPx?: number;
    hPx?: number;
    xPct: number;
    yPct: number;
    wPct: number;
    hPct: number;
    label?: string;
    inputType?: "number" | "text" | "combobox";
    comboboxItems?: string[];
  }>;
};

export type ChemFieldmap = Fieldmap<ChemFieldmapKey>;
export type OgttFieldmap = Fieldmap<OgttFieldmapKey>;
export type CbcFieldmap = Fieldmap<CbcFieldmapKey>;
export type BtFieldmap = Fieldmap<BtFieldmapKey>;
