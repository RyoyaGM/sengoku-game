import { DAIMYO_INFO, HISTORICAL_FAME } from '../data/daimyos';
import { PROVINCE_DATA_BASE } from '../data/provinces';

// --- 初期リソース計算 ---
export const INITIAL_RESOURCES = Object.keys(DAIMYO_INFO).reduce((acc, key) => {
  const baseFame = HISTORICAL_FAME[key] || 50;
  acc[key] = { 
      gold: 300, 
      rice: 300, 
      fame: baseFame, 
      donatedImperial: 0, 
      donatedShogunate: 0, 
      titles: [], 
      rank: null,
      isAlive: true // 初期状態は全員生存
  };
  return acc;
}, {});

// 個別の初期設定
if(INITIAL_RESOURCES['Ashikaga']) { INITIAL_RESOURCES['Ashikaga'].gold = 1000; INITIAL_RESOURCES['Ashikaga'].titles = ['征夷大将軍']; INITIAL_RESOURCES['Ashikaga'].rank = '従三位'; }
if(INITIAL_RESOURCES['Sho']) { INITIAL_RESOURCES['Sho'].titles = ['琉球王']; }
if(INITIAL_RESOURCES['Ryukyu_Sho']) { INITIAL_RESOURCES['Ryukyu_Sho'].titles = ['琉球王']; }
if(INITIAL_RESOURCES['Kitabatake']) { INITIAL_RESOURCES['Kitabatake'].titles = []; INITIAL_RESOURCES['Kitabatake'].rank = '従五位下'; }

// --- 同盟関係 ---
export const INITIAL_ALLIANCES = Object.keys(DAIMYO_INFO).reduce((acc, key) => ({...acc, [key]: []}), {});
const setAlliance = (a, b) => { if(INITIAL_ALLIANCES[a]) INITIAL_ALLIANCES[a].push(b); if(INITIAL_ALLIANCES[b]) INITIAL_ALLIANCES[b].push(a); };

// 初期同盟の設定
// ★変更点: 織田(Oda)と徳川(Tokugawa)の同盟を削除しました
setAlliance('Takeda', 'Hojo'); 
setAlliance('Takeda', 'Imagawa'); 
setAlliance('Hojo', 'Imagawa');
setAlliance('Azai', 'Asakura');

// --- 停戦・外交関係 ---
export const INITIAL_CEASEFIRES = Object.keys(DAIMYO_INFO).reduce((acc, key) => ({...acc, [key]: {}}), {});

const getInitialRelations = () => {
    const rel = {};
    const ids = Object.keys(DAIMYO_INFO);
    ids.forEach(id => {
        rel[id] = {};
        ids.forEach(target => {
            if (id === target) return;
            let val = 50;
            // 同盟削除に伴い、初期友好度も調整
            if (id === 'Takeda' && target === 'Hojo') val = 90;
            if ((id === 'Oda' && target === 'Imagawa') || (id === 'Takeda' && target === 'Uesugi')) val = 10;
            rel[id][target] = val;
        });
    });
    return rel;
};
export const INITIAL_RELATIONS = getInitialRelations();

// --- 国データの初期化 ---
function validateAndFixData(db) {
    const idMap = new Map();
    db.forEach(p => idMap.set(p.id, p));
    db.forEach(p => {
        p.neighbors.forEach(neighborId => {
            const neighbor = idMap.get(neighborId);
            if (neighbor) {
                if (!neighbor.neighbors.includes(p.id)) {
                    neighbor.neighbors.push(p.id);
                }
            } else {
                console.error(`Error: Province ${p.id} references missing neighbor ${neighborId}`);
            }
        });
    });
}

validateAndFixData(PROVINCE_DATA_BASE);

export const INITIAL_PROVINCES = PROVINCE_DATA_BASE.map(p => ({
  ...p,
  cx: p.cx * 2, cy: p.cy * 2,
  troops: p.troops || 500,
  commerce: p.commerce || 40,
  agriculture: p.agriculture || 40,
  defense: p.defense || 30,
  loyalty: 60, training: 50, actionsLeft: 3
}));