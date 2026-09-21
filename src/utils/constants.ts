export type SectionKey = 'Blood'|'Chem'|'Urine'|'Serology'|'Stool'|'Preg';

export type FieldDef = { key: string; label: string; normal: string };

export const TEST_SECTIONS: Record<SectionKey, {
  key: SectionKey; dataKey: string; label: string; icon: string; fields: FieldDef[];
}> = {
  Blood: {
    key:'Blood', dataKey:'blood', label:'دم', icon:'🩸',
    fields:[
      {key:'hb',label:'Hb',normal:'12 - 17 g/dl'},
      {key:'pcv',label:'PCV',normal:'36 - 50 %'},
      {key:'wbc',label:'WBC',normal:'4,000 - 11,000 /µl'},
      {key:'esr',label:'ESR',normal:'0 - 20 mm/hr'},
      {key:'abo',label:'ABO GROUP',normal:'—'},
      {key:'plt',label:'PLT',normal:'150,000 - 450,000 /µl'}
    ]
  },
  Chem: {
    key:'Chem', dataKey:'chem', label:'كيمياء', icon:'🧪',
    fields:[
      {key:'fbs',label:'FBS',normal:'70 - 110 mg/dl'},
      {key:'rbs',label:'RBS',normal:'70 - 140 mg/dl'},
      {key:'urea',label:'Urea',normal:'15 - 45 mg/dl'},
      {key:'creat',label:'Creatinine',normal:'0.6 - 1.3 mg/dl'},
      {key:'uric',label:'Uric Acid',normal:'3.5 - 7.2 mg/dl'},
      {key:'chol',label:'Cholesterol',normal:'< 200 mg/dl'},
      {key:'trig',label:'Triglycerides',normal:'< 150 mg/dl'}
    ]
  },
  Urine: {
    key:'Urine', dataKey:'urine', label:'بول', icon:'💧',
    fields:[
      {key:'color',label:'Color',normal:'Yellow'},
      {key:'appearance',label:'Appearance',normal:'Clear'},
      {key:'ph',label:'pH',normal:'4.5 - 8.0'},
      {key:'protein',label:'Protein',normal:'Negative'},
      {key:'glucose',label:'Glucose',normal:'Negative'},
      {key:'rbc',label:'RBC /HPF',normal:'0 - 2 /HPF'},
      {key:'pus',label:'Pus Cells',normal:'0 - 5 /HPF'},
      {key:'epithelial',label:'Epithelial',normal:'Few'},
      {key:'crystals',label:'Crystals',normal:'Nill'}
    ]
  },
  Serology: {
    key:'Serology', dataKey:'serology', label:'مصليات', icon:'🧬',
    fields:[
      {key:'crp',label:'CRP',normal:'Negative (< 6 mg/L)'},
      {key:'rf',label:'RF',normal:'Negative (< 14 IU/ml)'},
      {key:'aso',label:'ASO',normal:'Negative (< 200 IU/ml)'},
      {key:'hpylori',label:'H. pylori',normal:'Negative'},
      {key:'widal',label:'Widal',normal:'Titer < 1:80'}
    ]
  },
  Stool: {
    key:'Stool', dataKey:'stool', label:'براز', icon:'💩',
    fields:[
      {key:'color',label:'Color',normal:'Brown'},
      {key:'consistency',label:'Consistency',normal:'Formed'},
      {key:'mucus',label:'Mucus',normal:'Nill'},
      {key:'ova',label:'Ova / Parasites',normal:'Nill'}
    ]
  },
  Preg: {
    key:'Preg', dataKey:'preg', label:'حمل / هرمونات', icon:'🤰',
    fields:[
      {key:'preg',label:'Pregnancy Test',normal:'Negative'},
      {key:'tsh',label:'TSH',normal:'0.4 - 4.0 mIU/L'}
    ]
  }
};

export const SECTION_KEYS = Object.keys(TEST_SECTIONS) as SectionKey[];

export const emptySectionData = () => {
  const out:any = {};
  SECTION_KEYS.forEach(k => {
    out[TEST_SECTIONS[k].dataKey] = {};
    out[`include${k}`] = false;
  });
  return out;
};
