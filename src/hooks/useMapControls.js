// src/hooks/useMapControls.js
import { useState, useEffect } from 'react';
import { SEA_ROUTES } from '../data/provinces';

export const useMapControls = ({ provinces, setProvinces }) => {
    // --- マップ表示用 State ---
    const [mapTransform, setMapTransform] = useState({ x: 0, y: 0, scale: 0.6 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

    // --- 編集モード用 State ---
    const [isEditMode, setIsEditMode] = useState(false);
    const [draggingProvinceId, setDraggingProvinceId] = useState(null);

    // --- 初期位置設定 (京都中心) ---
    useEffect(() => {
        const kyoto = provinces.find(p => p.id === 'kyoto' || p.id === 'yamashiro');
        if (kyoto) {
            const initialScale = 0.6;
            const screenW = window.innerWidth;
            const screenH = window.innerHeight;
            const newX = (screenW / 2) - (kyoto.cx * initialScale);
            const newY = (screenH / 2) - (kyoto.cy * initialScale);
            setMapTransform({ x: newX, y: newY, scale: initialScale });
        }
    }, []); // 初回のみ実行

    // --- マウス操作ハンドラ ---
    const handleWheel = (e) => {
        const scaleAmount = -e.deltaY * 0.001;
        const newScale = Math.min(Math.max(0.2, mapTransform.scale + scaleAmount), 3);
        const ratio = newScale / mapTransform.scale;
        const newX = e.clientX - (e.clientX - mapTransform.x) * ratio;
        const newY = e.clientY - (e.clientY - mapTransform.y) * ratio;
        setMapTransform({ x: newX, y: newY, scale: newScale });
    };

    const handleMouseDown = (e) => {
        setDragStartPos({ x: e.clientX, y: e.clientY });
        setIsDragging(false);
    };

    const handleGlobalMouseMove = (e) => {
        if (draggingProvinceId && isEditMode) {
            // 領土の移動（編集モード）
            const deltaX = e.movementX / mapTransform.scale;
            const deltaY = e.movementY / mapTransform.scale;
            setProvinces(prev => prev.map(p => {
                if (p.id === draggingProvinceId) return { ...p, cx: p.cx + deltaX, cy: p.cy + deltaY };
                return p;
            }));
        } else if (e.buttons === 1) {
            // マップ全体の移動
            if (Math.abs(e.clientX - dragStartPos.x) > 5 || Math.abs(e.clientY - dragStartPos.y) > 5) {
                setIsDragging(true);
                setMapTransform(p => ({ ...p, x: p.x + e.movementX, y: p.y + e.movementY }));
            }
        }
    };

    const handleMouseUp = () => {
        setDraggingProvinceId(null);
        setIsDragging(false);
    };

    // --- データ出力機能 (編集モード用) ---
    const exportData = () => {
        const cleanProvinces = provinces.map(({ actionsLeft, ...rest }) => rest);
        const provincesString = cleanProvinces.map(p => '  ' + JSON.stringify(p)).join(',\n');
        const fileContent = `// src/data/provinces.js\n\nexport const SEA_ROUTES = ${JSON.stringify(SEA_ROUTES, null, 4)};\n\nexport const PROVINCE_DATA_BASE = [\n${provincesString}\n];\n`;

        const blob = new Blob([fileContent], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = 'provinces.js';
        document.body.appendChild(link); link.click();
        document.body.removeChild(link); URL.revokeObjectURL(url);
        alert("provinces.jsをダウンロードしました。");
    };

    return {
        mapTransform,
        isDragging,
        isEditMode,
        setIsEditMode,
        setDraggingProvinceId,
        handleWheel,
        handleMouseDown,
        handleGlobalMouseMove,
        handleMouseUp,
        exportData
    };
};