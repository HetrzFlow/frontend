import { Inst } from '../services';

// short inst name
export const getShortInstName = (inst?: Inst) => {
  return inst ? inst.name.replace(/(\/USD$|^USD\/)/, '') || '' : '';
};
