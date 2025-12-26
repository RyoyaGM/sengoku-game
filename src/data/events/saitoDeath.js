export const saitoDeathEvent = {
    id: 'saito_death',
    title: '斎藤義龍の死',
    image: null,
    year: 1561, season: '夏',

    description: '美濃の蝮と恐れられた斎藤義龍が急死しました。\n後を継いだ龍興は若く、家臣団の統制に苦しんでいるようです。\n美濃攻略の好機が訪れました。',

    trigger: (turn, provinces, daimyoStats) => {
        return turn === 6 && daimyoStats['Saito']?.isAlive !== false;
    },

    defaultResolve: (ctx) => {
        ctx.showLog("斎藤義龍が病没。美濃国内で動揺が広がっています。");
        ctx.setDaimyoStats(prev => {
            const s = prev['Saito'];
            if (!s) return prev;
            return {
                ...prev,
                Saito: { ...s, gold: Math.floor(s.gold * 0.7), rice: Math.floor(s.rice * 0.7) }
            };
        });
        ctx.setProvinces(prev => prev.map(p => {
            if (p.ownerId === 'Saito') {
                return { 
                    ...p, 
                    troops: Math.floor(p.troops * 0.7),
                    loyalty: Math.max(0, (p.loyalty || 50) - 20),
                    defense: Math.max(0, p.defense - 10)
                };
            }
            return p;
        }));
        return null;
    }
};