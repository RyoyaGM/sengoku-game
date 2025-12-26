// --- ヘルパー関数 ---
const resolveSurugaInvasion = (ctx) => {
    ctx.setAlliances(prev => {
        const next = { ...prev };
        const remove = (a, b) => {
            if (next[a]) next[a] = next[a].filter(id => id !== b);
            if (next[b]) next[b] = next[b].filter(id => id !== a);
        };
        const add = (a, b) => {
            if (!next[a]) next[a] = [];
            if (!next[a].includes(b)) next[a].push(b);
            if (!next[b]) next[b] = [];
            if (!next[b].includes(a)) next[b].push(a);
        };
        remove('Takeda', 'Imagawa');
        remove('Takeda', 'Hojo');
        add('Imagawa', 'Hojo');
        return next;
    });

    ctx.setRelations(prev => {
        const next = { ...prev };
        const setRel = (a, b, val) => {
             if (!next[a]) next[a] = {};
             next[a][b] = val;
             if (!next[b]) next[b] = {};
             next[b][a] = val;
        };
        setRel('Takeda', 'Imagawa', 0);
        setRel('Takeda', 'Hojo', 0);
        setRel('Imagawa', 'Hojo', 100);
        return next;
    });

    ctx.setProvinces(prev => prev.map(p => {
        if (p.ownerId === 'Takeda') return { ...p, training: Math.min(100, (p.training || 50) + 20) };
        if (p.ownerId === 'Imagawa') return { ...p, loyalty: Math.max(0, (p.loyalty || 50) - 20) };
        return p;
    }));
};

// --- イベント定義 ---

export const surugaInvasionEvent = {
    id: 'suruga_invasion',
    title: '駿河侵攻',
    image: null,
    year: 1568, season: '冬',

    description: '甲斐の武田信玄が甲相駿三国同盟を破棄し、駿河への侵攻を開始しました。\n今川家は最大の危機を迎えています。',

    trigger: (turn, provinces, daimyoStats) => {
        const takedaAlive = daimyoStats['Takeda']?.isAlive !== false;
        const imagawaAlive = daimyoStats['Imagawa']?.isAlive !== false;
        const hasSunpu = provinces.some(p => p.id === 'sunpu' && p.ownerId === 'Imagawa');
        return turn === 36 && takedaAlive && imagawaAlive && hasSunpu;
    },

    choices: {
        Takeda: [
            {
                text: '同盟を破棄し、侵攻する',
                description: '今川領を切り取り、海への道を開く。',
                resolve: (ctx) => {
                    ctx.showLog("武田家が今川家との同盟を破棄！駿河へ侵攻を開始しました。");
                    resolveSurugaInvasion(ctx);
                    return null;
                }
            },
            {
                text: '同盟を維持する',
                description: '義理を重んじ、北（上杉）への備えを固める。',
                resolve: (ctx) => {
                    ctx.showLog("武田信玄は今川との同盟維持を選択しました。");
                    return null;
                }
            }
        ]
    },

    defaultResolve: (ctx) => {
        ctx.showLog("武田軍が国境を越え、駿河へ侵攻！今川家との同盟は破棄されました。");
        resolveSurugaInvasion(ctx);
        return null;
    }
};