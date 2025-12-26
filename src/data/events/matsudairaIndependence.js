// src/data/events/matsudairaIndependence.js

// --- ヘルパー関数 ---

const resolveMatsudairaIndependence = (ctx, isPlayerTokugawa) => {
    ctx.showLog("【歴史イベント】松平元康（徳川家康）が今川家から独立を宣言！三河の地を取り戻しました。");

    ctx.setAlliances(prev => {
        const next = { ...prev };
        if (next['Imagawa']) next['Imagawa'] = next['Imagawa'].filter(id => id !== 'Tokugawa');
        if (next['Tokugawa']) next['Tokugawa'] = next['Tokugawa'].filter(id => id !== 'Imagawa');
        return next;
    });

    // 織田と徳川の間で一時的な停戦
    ctx.setCeasefires(prev => ({
        ...prev,
        Oda: { ...(prev.Oda || {}), Tokugawa: 6 },
        Tokugawa: { ...(prev.Tokugawa || {}), Oda: 6 }
    }));
    ctx.showLog("織田家と徳川家の間で、一時的な停戦（6ターン）が成立しました。");

    ctx.setRelations(prev => ({
        ...prev,
        Imagawa: { ...(prev.Imagawa || {}), Tokugawa: 20 },
        Tokugawa: { ...(prev.Tokugawa || {}), Imagawa: 20 },
        Oda: { ...(prev.Oda || {}), Tokugawa: 60 },
        Tokugawa: { ...(prev.Tokugawa || {}), Oda: 60 }
    }));

    ctx.setDaimyoStats(prev => ({
        ...prev,
        Tokugawa: {
            ...prev.Tokugawa,
            gold: (prev.Tokugawa?.gold || 0) + 500,
            rice: (prev.Tokugawa?.rice || 0) + 500,
            fame: (prev.Tokugawa?.fame || 0) + 50,
            isAlive: true,
            targetOverride: 'sunpu'
        },
        Oda: { 
            ...prev.Oda,
            targetOverride: 'inabayama' 
        },
        Mizuno: { 
            ...prev.Mizuno,
            isAlive: false
        }
    }));

    ctx.setProvinces(prev => {
        const okazaki = prev.find(p => p.id === 'okazaki');
        // ★修正: (岡崎の兵数 - 200) / 2 を駿府へ移動
        const moveTroops = okazaki ? Math.floor(Math.max(0, okazaki.troops - 200) / 2) : 0;
        
        const chita = prev.find(p => p.id === 'chita');
        const chitaTroops = chita ? chita.troops : 0;
        const troopsToKiyosu = Math.max(0, chitaTroops - 100) + 200; 

        return prev.map(p => {
            if (p.id === 'okazaki') {
                return { 
                    ...p, 
                    ownerId: 'Tokugawa', 
                    troops: 200, // 独立後は200になる
                    loyalty: 100,
                    training: Math.min(100, (p.training || 50) + 20)
                };
            }
            if (p.id === 'sunpu') {
                return { ...p, troops: p.troops + moveTroops };
            }
            if (p.id === 'chita' && p.ownerId === 'Mizuno') {
                return {
                    ...p,
                    ownerId: 'Oda',
                    troops: 100, 
                    loyalty: 100,
                    actionsLeft: 0 
                };
            }
            if (p.id === 'kiyosu') {
                return { ...p, troops: p.troops + troopsToKiyosu };
            }
            return p;
        });
    });
    
    ctx.updateResource('Imagawa', 0, 0, -20);
    ctx.showLog("【織水同盟】水野家が織田家に合流。主力が清洲へ集結し、知多が織田領となりました。");

    return {
        title: '松平独立',
        image: null, 
        description: isPlayerTokugawa 
            ? '独立を宣言しました！\n今川のくびきを脱し、これよりは織田と結んで天下を目指します。\n名は「徳川家康」と改めましょう。\n\nまた、知多の水野信元が織田家に合流しました。'
            : '松平元康は「徳川家康」と名を改め、今川家との従属関係を破棄しました。\n三河における今川の影響力は失われました。\n\nまた、知多の水野信元が織田家に合流しました。',
        year: 1560, season: '秋'
    };
};

// --- イベント定義 ---

export const matsudairaIndependenceEvent = {
    id: 'matsudaira_independence',
    title: '松平元康の独立',
    image: null,
    year: 1560, season: '秋',

    description: (daimyoId) => {
        if (daimyoId === 'Tokugawa') return '今川義元の死により、今川家は混乱の極みにあります。\n長年、今川の人質として耐え忍んできましたが、ついに故郷・岡崎城への帰還を果たしました。\n今こそ、今川の支配を脱し、三河松平家の再興を宣言する時です。';
        if (daimyoId === 'Imagawa') return '松平元康が岡崎城にて勝手に兵を動かしているとの報告が入りました。\n義元公の弔い合戦もせぬまま、独立を企てているようです。\n許しがたい裏切りですが、今の我々にこれを止める余力があるでしょうか...';
        return '三河の松平元康が、今川家の混乱に乗じて岡崎城で独立を宣言しました。\n今川の支配力は大きく低下し、東海の情勢が変わりつつあります。';
    },

    trigger: (turn, provinces, daimyoStats) => {
        const imagawaAlive = daimyoStats['Imagawa']?.isAlive !== false;
        const okazakiIsImagawa = provinces.some(p => p.id === 'okazaki' && p.ownerId === 'Imagawa');
        return turn === 3 && imagawaAlive && okazakiIsImagawa;
    },

    choices: {
        Tokugawa: [
            {
                text: '独立を宣言する',
                description: '今川家と手切れし、三河の主として名乗りを上げる。',
                resolve: (ctx) => resolveMatsudairaIndependence(ctx, true)
            },
            {
                text: '今はまだ雌伏の時',
                description: '独立は時期尚早。今川家への義理を通し、好機を待つ。',
                resolve: (ctx) => {
                    ctx.showLog("徳川家は今川家への忠誠を維持しました。");
                    return null;
                }
            }
        ],
        Imagawa: [
            {
                text: '独立を容認する',
                description: '阻止する力はない... 黙認し、無用な争いを避ける。',
                resolve: (ctx) => resolveMatsudairaIndependence(ctx, false)
            },
            {
                text: '討伐令を出す',
                description: '裏切りは許さぬ。断固として戦う姿勢を示す。',
                resolve: (ctx) => {
                      ctx.showLog("今川家は松平元康に対し討伐令を出しました！関係が「敵対」になります。");
                      ctx.setRelations(prev => ({
                        ...prev,
                        Imagawa: { ...(prev.Imagawa || {}), Tokugawa: 0 },
                        Tokugawa: { ...(prev.Tokugawa || {}), Imagawa: 0 }
                      }));
                      ctx.setAlliances(prev => {
                        const next = { ...prev };
                        if (next['Imagawa']) next['Imagawa'] = next['Imagawa'].filter(id => id !== 'Tokugawa');
                        if (next['Tokugawa']) next['Tokugawa'] = next['Tokugawa'].filter(id => id !== 'Imagawa');
                        return next;
                      });
                      return null;
                }
            }
        ]
    },

    defaultResolve: (ctx) => resolveMatsudairaIndependence(ctx, false)
};