export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

export const uid = (prefix='id') => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

export const displayDate = (iso?:string) => {
  if(!iso) return '';
  const [y,m,d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
};

export const resultCount = (p:any) => {
  let n=0;
  for(const k of ['blood','chem','urine','serology','stool','preg']) {
    const d=p[k]||{};
    n += Object.values(d).filter(v => String(v??'').trim()!=='').length;
  }
  return n;
};

export const patientMatchesText = (p:any,q:string) => {
  if(!q.trim()) return true;
  const hay = JSON.stringify(p).toLowerCase();
  return hay.includes(q.trim().toLowerCase());
};
