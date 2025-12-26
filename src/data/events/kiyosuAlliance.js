// --- ヘルパー関数 ---
const resolveKiyosuAlliance = (ctx) => {
    ctx.showLog("織田家と徳川家が固い同盟を結びました（清州同盟）。");
    
    ctx.setAlliances(prev => {
        const next = { ...prev };
        if (!next['Oda']) next['Oda'] = [];
        if (!next['Oda'].includes('Tokugawa')) next['Oda'].push('Tokugawa');
        
        if (!next['Tokugawa']) next['Tokugawa'] = [];
        if (!next['Tokugawa'].includes('Oda')) next['Tokugawa'].push('Oda');
        return next;
    });

    ctx.setRelations(prev => ({
        ...prev,
        Oda: { ...prev.Oda, Tokugawa: 100 },
        Tokugawa: { ...prev.Tokugawa, Oda: 100 }
    }));
    
    ctx.setDaimyoStats(prev => ({
        ...prev,
        Oda: { ...prev.Oda, targetOverride: 'inabayama' },
        Tokugawa: { ...prev.Tokugawa, targetOverride: 'sunpu' }
    }));
    
    return {
        title: '清州同盟 締結',
        image: null,
        description: '織田信長と徳川家康は同盟を結びました。\n織田は北（美濃）へ、徳川は東（今川領）へ、\n互いに背後を預け、それぞれの覇道を進みます。',
        year: 1562, season: '春'
    };
};

// --- イベント定義 ---

export const kiyosuAllianceEvent = {
    id: 'kiyosu_alliance',
    title: '清州同盟',
    image: null,
    year: 1562, season: '春',

    description: '織田信長と徳川家康、両雄が清洲城にて会談。\n東西の憂いを断つため、同盟を結ぶ運びとなりました。',

    trigger: (turn, provinces, daimyoStats) => {
        const odaAlive = daimyoStats['Oda']?.isAlive !== false;
        const tokugawaAlive = daimyoStats['Tokugawa']?.isAlive !== false;
        return turn === 9 && odaAlive && tokugawaAlive;
    },

    choices: {
        Oda: [
            {
                text: '同盟を結ぶ',
                description: '背後（東）を徳川に任せ、美濃攻略に集中する。',
                resolve: (ctx) => resolveKiyosuAlliance(ctx)
            },
            {
                text: '拒否する',
                description: '徳川を信用できない。独自に覇道を行く。',
                resolve: (ctx) => {
                    ctx.showLog("織田家は同盟を拒否しました。");
                    return null;
                }
            }
        ],
        Tokugawa: [
            {
                text: '同盟を結ぶ',
                description: '西の脅威を排除し、今川領への侵攻に集中する。',
                resolve: (ctx) => resolveKiyosuAlliance(ctx)
            },
            {
                text: '拒否する',
                description: '織田は信用できない。',
                resolve: (ctx) => {
                    ctx.showLog("徳川家は同盟を拒否しました。");
                    return null;
                }
            }
        ]
    },

    defaultResolve: (ctx) => resolveKiyosuAlliance(ctx)
};