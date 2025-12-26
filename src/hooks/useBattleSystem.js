// src/hooks/useBattleSystem.js
import { useState } from 'react';
import { DAIMYO_INFO } from '../data/daimyos';

export const useBattleSystem = ({
    provinces,
    setProvinces,
    relations,
    updateResource,
    updateRelation,
    showLog,
    advanceTurn,
    playerDaimyoId,
    daimyoStats, 
    modalState,
    setModalState,
    setIsResolvingBattles,
    turn // ★追加: 季節判定のためにturnを受け取る
}) => {
    const [pendingBattles, setPendingBattles] = useState([]);
    const [selectedTactic, setSelectedTactic] = useState('field'); // 'siege' or 'field'

    // --- 次の戦闘を処理 ---
    const processNextPendingBattle = () => {
        if (pendingBattles.length === 0) {
            setIsResolvingBattles(false);
            advanceTurn();
            return;
        }
        const battle = pendingBattles[0];
        
        // プレイヤーが防衛側の場合、戦術選択モーダルを表示
        if (battle.defender.ownerId === playerDaimyoId) {
            setModalState({ type: 'tactic_selection', data: { battle } });
        } else {
            // AI同士の場合はランダムまたはデフォルト
            handleTacticSelection('field');
        }
    };

    // --- 戦術選択後の処理 ---
    const handleTacticSelection = (tactic) => {
        setSelectedTactic(tactic);
        const battle = pendingBattles[0];
        
        // 籠城(siege)を選んだ場合、防衛側の防御力を一時的に上げる処理が必要だが
        // ここではBattleSceneに渡すデータにフラグを立てるか、Defense値を加算して渡す
        // BattleScene側で計算に使われるため、modalStateのdataを更新する
        
        let defenseBonus = 0;
        if (tactic === 'siege') {
            defenseBonus = 50; // 籠城ボーナス
        }

        const defenderProv = provinces.find(p => p.id === battle.defender.id);
        const neighbors = defenderProv.neighbors.map(nid => provinces.find(p => p.id === nid));
        
        const potentialAllies = neighbors
            .filter(n => n.ownerId !== playerDaimyoId && n.ownerId !== battle.attackerId)
            .map(n => ({ id: n.ownerId, name: DAIMYO_INFO[n.ownerId].name }))
            .filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);

        // 次のステップ：援軍要請へ
        // battleオブジェクトにdefenseBonusを含めて渡す
        setModalState({ 
            type: 'reinforcement_request', 
            data: { 
                battle: { 
                    ...battle, 
                    defender: { 
                        ...battle.defender, 
                        defense: (battle.defender.defense || 0) + defenseBonus // 防御力加算
                    }
                }, 
                potentialAllies 
            } 
        });
    };

    // --- 援軍要請の決定 ---
    const handleReinforcementDecision = (allyId) => {
        const { battle } = modalState.data;
        let allyTroops = 0;
        let allyName = null;
        let isSuccess = false;

        if (allyId) {
            const rel = relations[playerDaimyoId]?.[allyId] || 50;
            const successChance = rel / 100;
            if (Math.random() < successChance) {
                isSuccess = true;
                allyName = DAIMYO_INFO[allyId].name;
                allyTroops = 500;
                showLog(`${allyName}が援軍要請に応じました！ (兵+${allyTroops})`);
                updateRelation(allyId, 5);
            } else {
                showLog(`${DAIMYO_INFO[allyId].name}に援軍を断られました...`);
                updateRelation(allyId, -5);
            }
        }

        setModalState({
            type: 'battle',
            data: {
                attacker: battle.attacker,
                defender: { ...battle.defender, troops: battle.defender.troops + allyTroops },
                attackerAmount: battle.attackerAmount,
                originalDefenderTroops: battle.defender.troops,
                reinforcement: isSuccess ? { allyId, troops: allyTroops, cost: 500 } : null
            }
        });
    };

    // --- 戦闘終了後の処理 ---
    const handleBattleFinish = (res) => {
        const { attacker, defender, reinforcement } = modalState.data;
        const { attackerRemaining, defenderRemaining } = res;

        // --- ダメージ計算ロジック ---
        // 兵力差によるスケール (0.0 ~ 1.0)
        // 激戦（差が小さい）ほど被害が大きい設定にするか、蹂躙（差が大きい）ほど被害が大きいか？
        // 要件「減少度合いは、戦争決着時の兵力差によって決まる」
        // 通常、激しい戦闘（兵力差小）の方が国土は荒れるが、
        // ここでは「蹂躙された度合い」として、敵が多く残っている（負けた場合）or 敵を殲滅したがこちらも被害甚大
        // シンプルに「総兵力に対する死傷者数の割合」や「残り兵力差」を使う
        const totalInitial = attacker.attackerAmount + defender.originalDefenderTroops; // 概算
        const totalRemaining = attackerRemaining + defenderRemaining;
        const casualties = totalInitial - totalRemaining;
        const damageIntensity = Math.min(1.0, casualties / (totalInitial || 1)); // 死傷率が高いほどダメージ大

        // 戦術による係数
        // 籠城(siege): 商業1.5倍被害, 農業(秋)1.5倍被害
        // 出城(field): 商業0.5倍被害, 農業(秋)0.5倍被害
        const tacticMult = selectedTactic === 'siege' ? 1.5 : 0.5;

        // 実際の減少率 (最大50%カットなど適当にキャップを設ける)
        const baseLoss = damageIntensity * 0.5; // 最大でも5割減ベース
        const commLoss = Math.min(0.9, baseLoss * tacticMult); 
        const agriLoss = Math.min(0.9, baseLoss * tacticMult);

        const battleDamage = {
            commerce: commLoss,
            agriculture: agriLoss,
            seasonCheck: (turn - 1) % 4, // 0:春, 1:夏, 2:秋, 3:冬
            tactic: selectedTactic
        };

        setProvinces(prev => prev.map(p => {
            if (p.id === defender.id) {
                if (defenderRemaining <= 0) {
                    // 陥落
                    return { 
                        ...p, 
                        ownerId: attacker.ownerId, 
                        troops: attackerRemaining, 
                        actionsLeft: 0, 
                        loyalty: 30, 
                        defense: Math.max(0, (p.defense || 0) - 20),
                        battleDamage // ダメージ記録
                    };
                } else {
                    // 防衛成功
                    return { 
                        ...p, 
                        troops: Math.max(0, defenderRemaining - (reinforcement ? reinforcement.troops : 0)),
                        battleDamage // ダメージ記録
                    };
                }
            }
            return p;
        }));

        // ログ出力
        if (defenderRemaining <= 0) {
            const attackerName = DAIMYO_INFO[attacker.ownerId]?.name || attacker.ownerId;
            showLog(`${attackerName}軍が${defender.name}を制圧！`);
            updateResource(attacker.ownerId, 0, 0, 5);
            const defenderInfo = DAIMYO_INFO[defender.ownerId];
            if (defenderInfo && defenderInfo.homeProvinceId === defender.id) {
                updateResource(defender.ownerId, 0, 0, -10);
                showLog(`${defenderInfo.name}家、本拠地陥落...名声失墜！`);
            } else {
                updateResource(defender.ownerId, 0, 0, -5);
            }
        } else if (attackerRemaining <= 0) {
            const attackerName = DAIMYO_INFO[attacker.ownerId]?.name || attacker.ownerId;
            showLog(`${attackerName}軍、${defender.name}攻略に失敗。`);
            updateResource(attacker.ownerId, 0, 0, -5);
            updateResource(defender.ownerId, 0, 0, 5);
        } else {
            const attackerName = DAIMYO_INFO[attacker.ownerId]?.name || attacker.ownerId;
            showLog(`${attackerName}軍、${defender.name}を攻めきれず撤退。`);
            updateResource(attacker.ownerId, 0, 0, -5);
            updateResource(defender.ownerId, 0, 0, 5);
        }

        setPendingBattles(prev => prev.slice(1));

        if (defenderRemaining > 0 && reinforcement && defender.ownerId === playerDaimyoId) {
            setModalState({ type: 'reward_payment', data: { allyId: reinforcement.allyId, amount: reinforcement.cost } });
        } else {
            setModalState({ type: null });
            setIsResolvingBattles(false);
        }
    };

    const handleRewardPayment = (pay) => {
        const { allyId, amount } = modalState.data;
        if (pay) {
            if (daimyoStats[playerDaimyoId].gold >= amount) {
                updateResource(playerDaimyoId, -amount, 0);
                updateRelation(allyId, 10);
                showLog(`${DAIMYO_INFO[allyId].name}に報酬を支払いました。`);
            } else {
                showLog(`資金不足で報酬を払えませんでした...`);
                updateRelation(allyId, -20);
            }
        } else {
            showLog(`報酬を支払いませんでした。関係が悪化しました。`);
            updateRelation(allyId, -50);
        }
        setModalState({ type: null });
        setIsResolvingBattles(false);
    };

    return {
        pendingBattles,
        setPendingBattles,
        processNextPendingBattle,
        handleReinforcementDecision,
        handleBattleFinish,
        handleRewardPayment,
        handleTacticSelection // ★追加
    };
};