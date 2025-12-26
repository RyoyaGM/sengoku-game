// src/data/events/enshuRebellion.js

export const enshuRebellionEvent = {
    id: 'enshu_so_geki',
    title: '遠州忩劇',
    image: null,
    year: 1562, season: '冬',

    description: '今川家の弱体化に伴い、遠江（遠州）の国人衆が一斉に反乱を起こしました（遠州忩劇）。\n今川氏真は対応に追われ、統制力を失いつつあります。',

    trigger: (turn, provinces, daimyoStats) => {
        const imagawaAlive = daimyoStats['Imagawa']?.isAlive !== false;
        const hasHamamatsu = provinces.some(p => p.id === 'hamamatsu' && p.ownerId === 'Imagawa');
        return turn === 12 && imagawaAlive && hasHamamatsu;
    },

    defaultResolve: (ctx) => {
        ctx.showLog("【歴史イベント】遠江にて国人一揆発生！今川家の支配力が低下しました。");
        ctx.setProvinces(prev => prev.map(p => {
            if (p.ownerId === 'Imagawa') {
                if (p.id !== 'sunpu') {
                    // ★修正: 兵力40%まで削減、ただし最低120は残す
                    const newTroops = Math.max(120, Math.floor(p.troops * 0.4));
                    return { 
                        ...p, 
                        troops: newTroops, 
                        loyalty: Math.max(0, (p.loyalty || 50) - 30) 
                    };
                }
            }
            return p;
        }));
        
        if (ctx.daimyoStats && ctx.daimyoStats['Tokugawa']?.isAlive !== false) ctx.updateResource('Tokugawa', 0, 0, 20);
        if (ctx.daimyoStats && ctx.daimyoStats['Takeda']?.isAlive !== false) ctx.updateResource('Takeda', 0, 0, 20);
        
        return null;
    }
};