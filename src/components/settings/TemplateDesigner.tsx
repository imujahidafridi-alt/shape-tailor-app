import { useState, useEffect, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { Save, X, RotateCcw } from 'lucide-react';
import { db } from '@/db/database';
import { DEFAULT_LAYOUT, DEFAULT_WAISTCOAT_LAYOUT, DEFAULT_COAT_LAYOUT, LayoutElement } from '@/utils/slipLayout';
import toast from 'react-hot-toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function TemplateDesigner({ isOpen, onClose }: Props) {
    const [layout, setLayout] = useState<LayoutElement[]>(DEFAULT_LAYOUT);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [pageSize, setPageSize] = useState<'A4' | 'A5'>('A5');
    const [activeTab, setActiveTab] = useState<'shalwar_kameez' | 'waistcoat' | 'coat'>('shalwar_kameez');

    useEffect(() => {
        if (isOpen) {
            loadLayout();
        }
    }, [isOpen]);

    const loadLayout = async (tab: 'shalwar_kameez' | 'waistcoat' | 'coat' = 'shalwar_kameez') => {
        const settings = await db.settings.toCollection().first();
        if (settings?.slipPageSize) {
            setPageSize(settings.slipPageSize);
        }

        let defaultForTab = DEFAULT_LAYOUT;
        let savedForTab: any[] | undefined = undefined;

        if (tab === 'shalwar_kameez') {
            defaultForTab = DEFAULT_LAYOUT;
            savedForTab = settings?.slipLayout;
        } else if (tab === 'waistcoat') {
            // Need to import DEFAULT_WAISTCOAT_LAYOUT from slipLayout.ts
            defaultForTab = DEFAULT_WAISTCOAT_LAYOUT;
            savedForTab = settings?.slipLayoutWaistcoat;
        } else if (tab === 'coat') {
            defaultForTab = DEFAULT_COAT_LAYOUT;
            savedForTab = settings?.slipLayoutCoat;
        }

        if (savedForTab && savedForTab.length > 0) {
            const mergedLayout = defaultForTab.map(defaultEl => {
                if (defaultEl.isFixed) return defaultEl; // Enforce default coordinates for fixed items
                const savedEl = savedForTab!.find((el: any) => el.id === defaultEl.id);
                
                // Auto-migrate banGroup if it has old massive width
                if (savedEl && savedEl.id === 'banGroup' && savedEl.width > 40) {
                    return { ...savedEl, width: defaultEl.width, height: defaultEl.height, x: defaultEl.x, y: defaultEl.y };
                }

                // Auto-migrate cuffGroup if it has old massive width
                if (savedEl && savedEl.id === 'cuffGroup' && savedEl.width > 40) {
                    return { ...savedEl, width: defaultEl.width, height: defaultEl.height, x: defaultEl.x, y: defaultEl.y };
                }

                return savedEl || defaultEl;
            });
            // Auto-inject missing shape6 if they saved their layout when it was deleted
            const hasShape6 = savedForTab.some((el: any) => el.id === 'svg_shape6');
            let finalLayout = mergedLayout;
            if (!hasShape6) {
                const shape6Default = defaultForTab.find(el => el.id === 'svg_shape6');
                if (shape6Default) {
                    finalLayout = [...mergedLayout, shape6Default];
                }
            }

            setLayout(finalLayout);
        } else {
            setLayout(defaultForTab);
        }
    };

    // Reload layout when tab changes
    useEffect(() => {
        if (isOpen) {
            loadLayout(activeTab);
            setSelectedId(null);
        }
    }, [activeTab, isOpen]);

    const handleSave = async () => {
        try {
            const settings = await db.settings.toCollection().first();
            const updateData: any = {
                slipPageSize: pageSize,
                updatedAt: new Date()
            };

            if (activeTab === 'shalwar_kameez') updateData.slipLayout = layout;
            if (activeTab === 'waistcoat') updateData.slipLayoutWaistcoat = layout;
            if (activeTab === 'coat') updateData.slipLayoutCoat = layout;

            if (settings && settings.id) {
                await db.settings.update(settings.id, updateData);
            } else {
                await db.settings.add({
                    shopName: 'Tailor Pro',
                    address: '',
                    phone1: '',
                    phone2: '',
                    ...updateData
                });
            }
            toast.success('Template layout saved!');
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save layout');
        }
    };

    const handleReset = async () => {
        if (window.confirm('Reset to default layout? All custom positioning will be lost.')) {
            if (activeTab === 'shalwar_kameez') {
                setLayout(DEFAULT_LAYOUT);
            } else if (activeTab === 'waistcoat') {
                const layout = DEFAULT_WAISTCOAT_LAYOUT;
                setLayout(layout);
            } else if (activeTab === 'coat') {
                const layout = DEFAULT_COAT_LAYOUT;
                setLayout(layout);
            }
        }
    };

    const handleRemoveElement = useCallback(() => {
        if (!selectedId) return;

        // Prevent deleting fixed elements
        const element = layout.find(el => el.id === selectedId);
        if (element?.isFixed) {
            toast.error('Cannot delete a fixed element.');
            return;
        }

        setLayout(prev => prev.filter(el => el.id !== selectedId));
        setSelectedId(null);
        toast.success('Element removed');
    }, [selectedId, layout]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'SELECT') {
                return;
            }
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
                handleRemoveElement();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, handleRemoveElement]);

    if (!isOpen) return null;

    // Helper to render the content of a LayoutElement visually
    const renderElementContent = (element: LayoutElement) => {
        switch (element.type) {
            case 'textBlock': {
                if (element.id === 'header_divider') {
                    return <div className="w-full h-full" style={{ backgroundColor: element.color || '#cbd5e1' }} />;
                }
                const fontFamily = element.direction === 'rtl' ? "'NotoNastaliqUrdu', serif" : 'Arial, sans-serif';
                return (
                    <div
                        className="w-full h-full flex items-center justify-center text-center font-bold"
                        style={{ direction: element.direction || 'ltr', fontFamily }}
                    >
                        <div style={{ fontSize: `${element.fontSize || 14}px`, color: element.color || '#0f172a' }}>
                            {element.content.split('\n').map((line: string, i: number) => (
                                <div key={i}>{line}</div>
                            ))}
                        </div>
                    </div>
                );
            }
            case 'input': {
                const isHiddenHeaderValue = element.content.hideLabel && ['sNo', 'customerName', 'karigar', 'suitQty'].includes(element.content.field);
                const isSuitQtyHeaderValue = element.id === 'header_val_suitQty' || (element.content.hideLabel && element.content.field === 'suitQty');
                
                return (
                    <div className={`w-full h-full flex items-center bg-white/50 relative ${isHiddenHeaderValue ? 'justify-center' : ''}`}>
                        {!element.content.hideLabel && (
                            <span className="font-semibold text-slate-600 text-[13px] px-1.5 shrink-0 whitespace-nowrap bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
                                {element.content.label}
                            </span>
                        )}
                        <div style={isSuitQtyHeaderValue ? { width: '84%', margin: '0 auto' } : { width: '100%' }} className="h-full"></div>
                        {element.content.dottedLine ? (
                            <div className="absolute left-6 right-1 bottom-1 border-b border-dashed border-slate-300 z-0 pointer-events-none"></div>
                        ) : (
                            <div className="absolute left-0 right-0 bottom-0 border-b border-solid border-slate-300 z-0 pointer-events-none"></div>
                        )}
                    </div>
                );
            }
            case 'svg': {
                const svgBase64 = element.content.raw
                    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(element.content.raw.replace(/\n/g, ''))}`
                    : `/SVG/${element.content.asset}`;

                return (
                    <div className="w-full h-full relative group/svg">
                        <img 
                            src={svgBase64} 
                            alt={element.id} 
                            className="w-full h-full object-contain pointer-events-none" 
                            style={{ filter: 'brightness(0) saturate(100%) invert(32%) sepia(13%) saturate(831%) hue-rotate(176deg) brightness(95%) contrast(88%)' }} 
                            draggable={false}
                        />
                        {(element.content.inputs || []).map((inp: any, idx: number) => {
                            let left = `${inp.relX}%`;
                            if (inp.placeX === 'left') left = '0%';
                            if (inp.placeX === 'right') left = '100%';
                            if (inp.placeX === 'center') left = '50%';

                            let top = `${inp.relY}%`;
                            if (inp.placeY === 'top') top = '0%';
                            if (inp.placeY === 'bottom') top = '100%';
                            if (inp.placeY === 'center') top = '50%';

                            let transform = `translate(-50%, -50%)`;
                            if (inp.placeX === 'left') transform = transform.replace('-50%', '0%');
                            if (inp.placeX === 'right') transform = transform.replace('-50%', '-100%');
                            if (inp.placeY === 'top') transform = transform.replace(/, -50%\)/, ', 0%)');
                            if (inp.placeY === 'bottom') transform = transform.replace(/, -50%\)/, ', -100%)');

                            return (
                                <div
                                    key={inp.id || idx}
                                    className="absolute bg-slate-200/60 rounded-sm flex items-center justify-center overflow-visible text-slate-900 font-bold pointer-events-none"
                                    style={{ left, top, minWidth: '2.5ch', height: '24px', transform, fontFamily: 'Arial, sans-serif' }}
                                    dir="ltr"
                                >
                                    <span className="text-[10px] text-blue-700/80 px-1 whitespace-nowrap">{inp.id}</span>
                                </div>
                            );
                        })}
                    </div>
                );
            }
            case 'damanGroup': {
                const options = element.content?.options || [
                    { key: 'daman_curved', asset: 'Asset 3.svg', labelUr: 'گول دامن' },
                    { key: 'daman_straight', asset: 'Asset 2.svg', labelUr: 'سیدھا دامن' },
                ];
                return (
                    <div className="w-full h-full flex items-end justify-center gap-4 font-urdu">
                        {options.map((opt: any) => {
                            const imgSrc = opt.raw 
                                ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(opt.raw.replace(/\n/g, ''))}` 
                                : `/SVG/${opt.asset}`;
                            return (
                                <div key={opt.key} className="flex flex-col items-center pointer-events-none">
                                    <img
                                        src={imgSrc}
                                        alt={opt.labelUr}
                                        className="w-10 h-8 object-contain"
                                        style={{ filter: 'brightness(0) saturate(100%) invert(32%) sepia(13%) saturate(831%) hue-rotate(176deg) brightness(95%) contrast(88%)' }}
                                        draggable={false}
                                    />
                                    <span className="text-[11px] font-semibold mt-1 text-slate-600 whitespace-nowrap font-urdu">{opt.labelUr || opt.label}</span>
                                    <div className="w-4 h-4 rounded-full border border-slate-300 mt-1" />
                                </div>
                            );
                        })}
                    </div>
                );
            }
            case 'silaiGroup': {
                const options = element.content?.options || [
                    { key: 'silai_single', label: 'سنگل سلائی' },
                    { key: 'silai_double_dd', label: 'ڈبل سلائی D.D' },
                    { key: 'silai_triple', label: 'ٹرپل سلائی' },
                    { key: 'silai_double', label: 'ڈبل سلائی' },
                    { key: 'silai_sada', labelUr: 'سادہ سلائی' },
                    { key: 'silai_sada_double', labelUr: 'سادہ ڈبل سلائی' },
                    { key: 'silai_chamak_tar', labelUr: 'چمک تار سنگل سلائی' },
                    { key: 'silai_chamak_tar_double', labelUr: 'چمک تار ڈبل سلائی' },
                    { key: 'silai_tak_pa_tak', labelUr: 'ٹک پہ ٹک سلائی' },
                    { key: 'silai_tak_pa_tak_samne', labelUr: 'ٹک پہ ٹک سامنے' },
                    { key: 'silai_choka', labelUr: 'چوکا سلائی' },
                ];
                return (
                    <div className="w-full h-full flex flex-col justify-center text-xs font-semibold text-slate-600 font-urdu px-2" style={{ width: 'fit-content' }}>
                        <select className="py-1 px-2 text-xs border rounded text-center font-urdu bg-white shadow-sm pointer-events-none appearance-none w-fit" style={{ fontFamily: "'NotoNastaliqUrdu', serif", maxWidth: '100%' }} dir="rtl">
                            <option value="">منتخب کریں</option>
                        </select>
                    </div>
                );
            }
            case 'banGroup': {
                const options = element.content?.options || [
                    { key: 'half_curved', labelUr: 'ہاف گول' },
                    { key: 'half_straight', labelUr: 'ہاف سیدھا' },
                    { key: 'full_curved', labelUr: 'فل گول' },
                    { key: 'full_straight', labelUr: 'فل سیدھا' },
                ];
                return (
                    <div className="w-full h-full flex flex-col justify-center text-xs font-semibold text-slate-600 font-urdu px-2" style={{ width: 'fit-content' }}>
                        <select className="py-1 px-2 text-xs border rounded text-center font-urdu bg-white shadow-sm pointer-events-none appearance-none w-fit" style={{ fontFamily: "'NotoNastaliqUrdu', serif", maxWidth: '100%' }} dir="rtl">
                            <option value="">کالر کا انتخاب</option>
                        </select>
                    </div>
                );
            }
            case 'cuffGroup': {
                const options = element.content?.options || [
                    { key: 'cuff_fold', labelUr: 'فولڈ کف', label: 'Fold Cuff' },
                    { key: 'cuff_seedha', labelUr: 'سیدھا کف', label: 'Seedha Cuff' },
                    { key: 'cuff_gol', labelUr: 'گول کف', label: 'Gol Cuff' },
                    { key: 'cuff_cut', labelUr: 'کٹ کف', label: 'Cut Cuff' },
                ];
                return (
                    <div className="w-full h-full flex flex-col justify-center text-xs font-semibold text-slate-600 font-urdu px-2" style={{ width: 'fit-content' }}>
                        <select className="py-1 px-2 text-xs border rounded text-center font-urdu bg-white shadow-sm pointer-events-none appearance-none w-fit" style={{ fontFamily: "'NotoNastaliqUrdu', serif", maxWidth: '100%' }} dir="rtl">
                            <option value="">کف کا انتخاب</option>
                        </select>
                    </div>
                );
            }
            case 'buttonDesignGroup': {
                const options = element.content?.options || [
                    { key: 'btn_tak', labelUr: 'ٹک بٹن', label: 'Tak Button' },
                    { key: 'btn_steel', labelUr: 'سٹیل بٹن', label: 'Steel Button' },
                    { key: 'btn_ring', labelUr: 'رنگ بٹن', label: 'Ring Button' },
                    { key: 'btn_vip', labelUr: 'وی آئی پی بٹن', label: 'VIP Button' },
                ];
                return (
                    <div className="w-full h-full flex flex-col justify-center text-xs font-semibold text-slate-600 font-urdu px-2" style={{ width: 'fit-content' }}>
                        <select className="py-1 px-2 text-xs border rounded text-center font-urdu bg-white shadow-sm pointer-events-none appearance-none w-fit" style={{ fontFamily: "'NotoNastaliqUrdu', serif", maxWidth: '100%' }} dir="rtl">
                            <option value="">بٹن ڈیزائن کا انتخاب</option>
                        </select>
                    </div>
                );
            }
            case 'wcCollarGroup': {
                const options = element.content?.options || [
                    { key: 'wc_collar_ban', asset: 'WaistCoat/Ban_Collar.svg', raw: wcBanCollarRaw, labelUr: 'بین کالر' },
                    { key: 'wc_collar_gol', asset: 'WaistCoat/Gol_Collar.svg', raw: wcGolCollarRaw, labelUr: 'گول کالر' },
                    { key: 'wc_collar_v', asset: 'WaistCoat/V_Shaped.svg', raw: wcVShapedRaw, labelUr: 'وی شیپ' },
                ];
                return (
                    <div className="w-full h-full flex flex-col justify-center text-xs font-semibold text-slate-600 font-urdu px-2" style={{ width: 'fit-content' }}>
                        <select className="py-3 px-2 text-[13px] leading-[2.2] border rounded text-center font-urdu bg-white shadow-sm pointer-events-none appearance-none w-fit" style={{ fontFamily: "'NotoNastaliqUrdu', serif", maxWidth: '100%' }} dir="rtl">
                            <option value="">کالر کا انتخاب</option>
                        </select>
                    </div>
                );
            }
            case 'wcGeraGroup': {
                const options = element.content?.options || [
                    { key: 'wc_gera_gol', labelUr: 'گول گیرا' },
                    { key: 'wc_gera_seedha', labelUr: 'سیدھا گیرا' },
                ];
                return (
                    <div className="w-full h-full flex flex-col justify-center text-xs font-semibold text-slate-600 font-urdu px-2" style={{ width: 'fit-content' }}>
                        <select className="py-3 px-2 text-[13px] leading-[2.2] border rounded text-center font-urdu bg-white shadow-sm pointer-events-none appearance-none w-fit" style={{ fontFamily: "'NotoNastaliqUrdu', serif", maxWidth: '100%' }} dir="rtl">
                            <option value="">گیرا کا انتخاب</option>
                        </select>
                    </div>
                );
            }
            case 'coatDoublePressGroup': {
                return (
                    <div className="w-full h-full flex items-center gap-3 px-2 pointer-events-none">
                        <div className="flex items-center gap-2 select-none">
                            <input type="checkbox" checked readOnly className="h-4 w-4 border-gray-300 rounded" />
                            <span className="text-[13px] font-semibold text-slate-700 font-urdu leading-[2.2]" style={{ fontFamily: "'NotoNastaliqUrdu', serif" }} dir="rtl">ڈبل پریس</span>
                        </div>
                    </div>
                );
            }
            case 'coatButtonGroup': {
                const options = [
                    { key: '1', labelUr: '1 بٹن' },
                    { key: '2', labelUr: '2 بٹن' }
                ];
                return (
                    <div className="w-full h-full flex items-center gap-4 px-2 pointer-events-none">
                        {options.map((opt) => (
                            <div key={opt.key} className="flex items-center gap-1.5 select-none">
                                <input type="radio" checked={opt.key === '1'} readOnly className="h-4 w-4 border-gray-300" />
                                <span className="text-[13px] font-semibold text-slate-700 font-urdu leading-[2.2]" style={{ fontFamily: "'NotoNastaliqUrdu', serif" }} dir="rtl">{opt.labelUr}</span>
                            </div>
                        ))}
                    </div>
                );
            }
            case 'coatChaakGroup': {
                const options = [
                    { key: 'band', labelUr: 'بند چاک' },
                    { key: '2', labelUr: '2 چاک' }
                ];
                return (
                    <div className="w-full h-full flex items-center gap-4 px-2 pointer-events-none">
                        {options.map((opt) => (
                            <div key={opt.key} className="flex items-center gap-1.5 select-none">
                                <input type="radio" checked={opt.key === 'band'} readOnly className="h-4 w-4 border-gray-300" />
                                <span className="text-[13px] font-semibold text-slate-700 font-urdu leading-[2.2]" style={{ fontFamily: "'NotoNastaliqUrdu', serif" }} dir="rtl">{opt.labelUr}</span>
                            </div>
                        ))}
                    </div>
                );
            }
            case 'skCollarToggleGroup': {
                return (
                    <div className="w-full h-full flex flex-row items-center gap-3 px-2 bg-slate-50/50 p-1.5 rounded border border-slate-100 shadow-sm pointer-events-none">
                        <div className="flex items-center gap-1.5 select-none">
                            <input type="radio" checked readOnly className="h-4 w-4 border-gray-300" />
                            <span className="text-[13px] font-semibold text-slate-700 font-urdu leading-[2.2] whitespace-nowrap" style={{ fontFamily: "'NotoNastaliqUrdu', serif" }} dir="rtl">بین کالر</span>
                        </div>
                        <div className="flex items-center gap-1.5 select-none">
                            <input type="radio" readOnly className="h-4 w-4 border-gray-300" />
                            <span className="text-[13px] font-semibold text-slate-700 font-urdu leading-[2.2] whitespace-nowrap" style={{ fontFamily: "'NotoNastaliqUrdu', serif" }} dir="rtl">سادہ کالر</span>
                        </div>
                    </div>
                );
            }
            case 'textArea': {
                return (
                    <div className="w-full h-full flex flex-col bg-white/50">
                        {!element.content.hideLabel && (
                            <span className="font-semibold text-slate-600 px-1.5 text-[13px] bg-white w-fit z-10" style={{ fontFamily: 'Arial, sans-serif' }}>
                                {element.content?.label || 'Other Details / Notes'}
                            </span>
                        )}
                        <div className="flex-1 w-full bg-transparent border border-slate-300 border-dashed rounded z-10"></div>
                    </div>
                );
            }
            case 'skPattiKaajGroup': {
                return (
                    <div className="w-full h-full flex items-center gap-3 px-2 pointer-events-none">
                        <div className="flex items-center gap-2 select-none">
                            <input type="checkbox" checked readOnly className="h-4 w-4 border-gray-300 rounded" />
                            <span className="text-[13px] font-semibold text-slate-700 font-urdu leading-[2.2]" style={{ fontFamily: "'NotoNastaliqUrdu', serif" }} dir="rtl">پٹی کاج ہو</span>
                        </div>
                    </div>
                );
            }
            default:
                return <div className="w-full h-full bg-gray-200">Unknown</div>;
        }
    };

    // Helper to edit the selected element
    const updateSelectedElement = (updates: Partial<LayoutElement>) => {
        if (!selectedId) return;
        setLayout(prev => prev.map(el => el.id === selectedId ? { ...el, ...updates } : el));
    };

    const updateSelectedContent = (contentUpdates: any) => {
        if (!selectedId) return;
        setLayout(prev => prev.map(el => {
            if (el.id === selectedId) {
                return { ...el, content: { ...el.content, ...contentUpdates } };
            }
            return el;
        }));
    };



    const handleExport = async () => {
        try {
            const settings = await db.settings.toCollection().first();
            

            // Collect all three layouts. If un-edited/unsaved in DB, fallback to their default constants.
            const allLayouts: Record<string, any[]> = {
                shalwar_kameez: activeTab === 'shalwar_kameez' ? layout : (settings?.slipLayout || DEFAULT_LAYOUT),
                waistcoat: activeTab === 'waistcoat' ? layout : (settings?.slipLayoutWaistcoat || DEFAULT_WAISTCOAT_LAYOUT),
                coat: activeTab === 'coat' ? layout : (settings?.slipLayoutCoat || DEFAULT_COAT_LAYOUT),
            };

            const exportData: Record<string, any[]> = {};

            // Strip heavy 'raw' SVG content before exporting to keep the file lightweight and shareable.
            for (const [key, currentLayout] of Object.entries(allLayouts)) {
                exportData[key] = currentLayout.map((el: any) => {
                    if (el.type === 'svg' && el.content) {
                        const { raw, ...restContent } = el.content;
                        return { ...el, content: restContent };
                    }
                    return el;
                });
            }

            const payload = {
                version: '1.2_combined',
                layouts: exportData
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `tailorpro_all_templates_${Date.now()}.json`);
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        } catch (err) {
            toast.error('Failed to export templates.');
            console.error(err);
        }
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const importedLayout = JSON.parse(event.target?.result as string);
                
                

                if (importedLayout.version === '1.2_combined' && importedLayout.layouts) {
                    const settings = await db.settings.toCollection().first();
                    const updateData: any = { updatedAt: new Date() };

                    // Helper to merge imported array with Default defaults maintaining fixed anchors
                    const mergeLayouts = (importedArr: any[] | undefined, defaultArr: any[]) => {
                        if (!importedArr) return defaultArr;
                        return defaultArr.map(defaultEl => {
                            if (defaultEl.isFixed) return defaultEl;
                            const importedEl = importedArr.find((el: any) => el.id === defaultEl.id);
                            return importedEl || defaultEl;
                        });
                    };

                    updateData.slipLayout = mergeLayouts(importedLayout.layouts.shalwar_kameez, DEFAULT_LAYOUT);
                    updateData.slipLayoutWaistcoat = mergeLayouts(importedLayout.layouts.waistcoat, DEFAULT_WAISTCOAT_LAYOUT);
                    updateData.slipLayoutCoat = mergeLayouts(importedLayout.layouts.coat, DEFAULT_COAT_LAYOUT);

                    if (settings && settings.id) {
                        await db.settings.update(settings.id, updateData);
                    } else {
                        await db.settings.add({
                            shopName: 'Tailor Pro',
                            address: '',
                            phone1: '',
                            phone2: '',
                            ...updateData
                        });
                    }

                    // Reload UI from DB
                    loadLayout(activeTab);
                    setSelectedId(null);
                    toast.success('All templates imported successfully!');
                } else if (Array.isArray(importedLayout)) {
                    // Backwards compatibility branch! If they drop an old single template... merge only into ACTIVE tab
                    let activeDefault = DEFAULT_LAYOUT;
                    if (activeTab === 'waistcoat') activeDefault = DEFAULT_WAISTCOAT_LAYOUT;
                    if (activeTab === 'coat') activeDefault = DEFAULT_COAT_LAYOUT;

                    const mergedLayout = activeDefault.map(defaultEl => {
                        if (defaultEl.isFixed) return defaultEl; // Enforce fixed from defaults
                        const importedEl = importedLayout.find((el: any) => el.id === defaultEl.id);
                        return importedEl || defaultEl;
                    });
                    setLayout(mergedLayout);
                    toast.success('Single tab layout imported successfully!');
                } else {
                    toast.error('Invalid layout file format.');
                }
            } catch (err) {
                toast.error('Failed to parse layout file.');
            }
        };
        reader.readAsText(file);
        // Reset file input
        e.target.value = '';
    };

    const selectedElement = layout.find(el => el.id === selectedId);

    return (
        <div className="fixed inset-0 z-50 bg-gray-900/90 flex flex-col">
            {/* Header Toolbar */}
            <div className="bg-white px-6 py-4 flex justify-between items-center shadow-md z-10">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Template Designer</h2>
                    <div className="flex items-center gap-4 mt-1">
                        <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                            <button
                                onClick={() => setActiveTab('shalwar_kameez')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'shalwar_kameez' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Shalwar Kameez
                            </button>
                            <button
                                onClick={() => setActiveTab('waistcoat')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'waistcoat' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Waistcoat
                            </button>
                            <button
                                onClick={() => setActiveTab('coat')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'coat' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Coat
                            </button>
                        </div>

                        <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
                            <label className="text-sm font-medium text-gray-700">Page Size:</label>
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(e.target.value as 'A4' | 'A5')}
                                className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="A5">A5 (Half Letter)</option>
                                <option value="A4">A4 (Full Letter)</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
                            <button onClick={handleExport} className="text-sm text-blue-600 hover:text-blue-800 underline">
                                Export JSON
                            </button>
                            <span className="text-gray-300">|</span>
                            <label className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer">
                                Import JSON
                                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                            </label>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleReset} className="btn btn-secondary flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" /> Reset to Default
                    </button>
                    <button onClick={handleSave} className="btn btn-primary flex items-center gap-2">
                        <Save className="w-4 h-4" /> Save Layout
                    </button>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Canvas Area */}
                <div
                    className="flex-1 overflow-auto bg-gray-100 p-8 flex justify-center items-start outline-none"
                    onClick={(e) => {
                        // Deselect if clicking directly on the background gray area
                        if (e.target === e.currentTarget) setSelectedId(null);
                    }}
                >
                    {/* The "Paper" Container */}
                    <div
                        className="relative bg-white shadow-2xl transition-all duration-300"
                        style={{
                            width: '500px',
                            height: pageSize === 'A4' ? '707px' : '700px',
                            border: '1px solid #cbd5e1',
                            fontFamily: 'sans-serif',
                            color: '#0f172a'
                        }}
                        dir="ltr"
                    >
                        {layout.map((element, index) => {
                            if (element.isFixed) {
                                return (
                                    <div
                                        key={element.id}
                                        style={{
                                            position: 'absolute',
                                            top: `${element.y}%`,
                                            left: `${element.x}%`,
                                            width: element.width ? `${element.width}%` : 'auto',
                                            height: element.height ? `${element.height}%` : 'auto',
                                        }}
                                        className="pointer-events-none"
                                    >
                                        {renderElementContent(element)}
                                    </div>
                                );
                            }

                            return (
                                <Rnd
                                    key={element.id}
                                    bounds="parent"
                                    size={{
                                        width: element.width ? `${element.width}%` : 'auto',
                                        height: element.height ? `${element.height}%` : 'auto'
                                    }}
                                    position={{
                                        x: (element.x / 100) * 500,
                                        y: (element.y / 100) * (pageSize === 'A4' ? 707 : 700)
                                    }}
                                    onDragStop={(_e, d) => {
                                        const newLayout = [...layout];
                                        newLayout[index].x = (d.x / 500) * 100;
                                        newLayout[index].y = (d.y / (pageSize === 'A4' ? 707 : 700)) * 100;
                                        setLayout(newLayout);
                                    }}
                                    onResizeStop={(_e, _direction, ref, _delta, position) => {
                                        const newLayout = [...layout];
                                        newLayout[index].width = (ref.offsetWidth / 500) * 100;
                                        newLayout[index].height = (ref.offsetHeight / (pageSize === 'A4' ? 707 : 700)) * 100;
                                        newLayout[index].x = (position.x / 500) * 100;
                                        newLayout[index].y = (position.y / (pageSize === 'A4' ? 707 : 700)) * 100;
                                        setLayout(newLayout);
                                    }}
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation(); // Prevent background click from deselecting
                                        setSelectedId(element.id);
                                    }}
                                    className={`group ${selectedId === element.id ? 'ring-2 ring-blue-500 z-10' : 'hover:ring-1 hover:ring-gray-300 z-0'}`}
                                >
                                    {renderElementContent(element)}

                                    {/* Hover label for dragging */}
                                    <div className="absolute -top-6 left-0 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                                        {element.id}
                                    </div>
                                </Rnd>
                            );
                        })}
                    </div>
                </div>

                {/* Properties Panel (Right Sidebar) */}
                {selectedElement && (
                    <div className="w-80 bg-white border-l border-gray-200 shadow-xl overflow-y-auto flex flex-col">
                        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Properties</h3>
                            <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-6">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Selected Element</label>
                                <div className="p-2 bg-blue-50 text-blue-700 font-mono text-sm rounded border border-blue-100 break-all">
                                    {selectedElement.id}
                                </div>
                                <div className="mt-1 text-xs text-gray-500">
                                    Type: <span className="font-medium">{selectedElement.type}</span>
                                </div>
                                <button
                                    onClick={handleRemoveElement}
                                    className="mt-3 w-full py-1.5 px-3 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded text-sm font-medium transition-colors"
                                >
                                    Delete Component
                                </button>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Dimensions & Position</label>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">X (%)</label>
                                        <input
                                            type="number"
                                            value={Math.round(selectedElement.x)}
                                            onChange={(e) => updateSelectedElement({ x: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Y (%)</label>
                                        <input
                                            type="number"
                                            value={Math.round(selectedElement.y)}
                                            onChange={(e) => updateSelectedElement({ y: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Width (%)</label>
                                        <input
                                            type="number"
                                            value={selectedElement.width ? Math.round(selectedElement.width) : ''}
                                            onChange={(e) => updateSelectedElement({ width: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="Auto"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Height (%)</label>
                                        <input
                                            type="number"
                                            value={selectedElement.height ? Math.round(selectedElement.height) : ''}
                                            onChange={(e) => updateSelectedElement({ height: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="Auto"
                                        />
                                    </div>
                                </div>
                            </div>

                            {(selectedElement.type === 'textBlock' || selectedElement.type === 'input') && (
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Styling</label>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Font Size (px)</label>
                                        <input
                                            type="number"
                                            value={selectedElement.fontSize || 14}
                                            onChange={(e) => updateSelectedElement({ fontSize: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        />
                                    </div>

                                    {selectedElement.type === 'textBlock' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={selectedElement.color || '#ef4444'}
                                                    onChange={(e) => updateSelectedElement({ color: e.target.value })}
                                                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                                />
                                                <input
                                                    type="text"
                                                    value={selectedElement.color || '#ef4444'}
                                                    onChange={(e) => updateSelectedElement({ color: e.target.value })}
                                                    className="flex-1 px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {selectedElement.type === 'input' && (
                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-3">
                                                <input
                                                    type="checkbox"
                                                    id="hideLabel"
                                                    checked={!!selectedElement.content?.hideLabel}
                                                    onChange={(e) => updateSelectedContent({ hideLabel: e.target.checked })}
                                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor="hideLabel" className="text-sm font-medium text-gray-700">Hide Label Text</label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedElement.type === 'svg' && (
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <div className="flex flex-col gap-2 mb-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                        <label className="block text-xs font-semibold text-blue-800 uppercase tracking-wider">Custom SVG Image</label>
                                        <input
                                            type="file"
                                            accept=".svg"
                                            className="text-xs w-full text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        const rawSvg = event.target?.result as string;
                                                        // Basic sanitize/cleanup
                                                        const cleanSvg = rawSvg.replace(/<!DOCTYPE.*?>/i, '').replace(/<\?xml.*?\?>/i, '');
                                                        updateSelectedContent({ raw: cleanSvg });
                                                        toast.success('Custom SVG applied to shape');
                                                    };
                                                    reader.readAsText(file);
                                                }
                                            }}
                                        />
                                        <p className="text-[10px] text-slate-500 leading-tight">Upload an SVG file to replace the default shape. SVGs will be automatically themed.</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Shape Inputs</label>
                                        <button
                                            onClick={() => {
                                                const currentInputs = selectedElement.content.inputs || [];
                                                const newId = `${selectedElement.id}_${currentInputs.length + 1}`;
                                                updateSelectedContent({ inputs: [...currentInputs, { id: newId, relX: 50, relY: 50 }] });
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800"
                                        >
                                            + Add
                                        </button>
                                    </div>
                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                        {(selectedElement.content.inputs || []).map((inp: any, idx: number) => (
                                            <div key={idx} className="bg-gray-50 p-2 rounded border border-gray-200 text-xs space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <input
                                                        type="text"
                                                        value={inp.id}
                                                        onChange={(e) => {
                                                            const newInputs = [...selectedElement.content.inputs];
                                                            newInputs[idx].id = e.target.value;
                                                            updateSelectedContent({ inputs: newInputs });
                                                        }}
                                                        className="font-mono text-xs w-24 border-gray-300 rounded p-1"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const newInputs = selectedElement.content.inputs.filter((_: any, i: number) => i !== idx);
                                                            updateSelectedContent({ inputs: newInputs });
                                                        }}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        Drop
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 mb-2">
                                                    <div>
                                                        <span className="text-gray-500 block mb-0.5">Left (X%)</span>
                                                        <input type="number" value={inp.relX} className="w-full border-gray-300 rounded p-1" onChange={(e) => {
                                                            const newInputs = [...selectedElement.content.inputs];
                                                            newInputs[idx].relX = Number(e.target.value);
                                                            updateSelectedContent({ inputs: newInputs });
                                                        }} />
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block mb-0.5">Top (Y%)</span>
                                                        <input type="number" value={inp.relY} className="w-full border-gray-300 rounded p-1" onChange={(e) => {
                                                            const newInputs = [...selectedElement.content.inputs];
                                                            newInputs[idx].relY = Number(e.target.value);
                                                            updateSelectedContent({ inputs: newInputs });
                                                        }} />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    <div>
                                                        <span className="text-gray-500 block mb-0.5">Align X</span>
                                                        <select
                                                            value={inp.placeX || 'manual'}
                                                            className="w-full border-gray-300 rounded p-1 text-xs"
                                                            onChange={(e) => {
                                                                const newInputs = [...selectedElement.content.inputs];
                                                                newInputs[idx].placeX = e.target.value;
                                                                updateSelectedContent({ inputs: newInputs });
                                                            }}
                                                        >
                                                            <option value="manual">Manual (Use X%)</option>
                                                            <option value="left">Left</option>
                                                            <option value="center">Center</option>
                                                            <option value="right">Right</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block mb-0.5">Align Y</span>
                                                        <select
                                                            value={inp.placeY || 'manual'}
                                                            className="w-full border-gray-300 rounded p-1 text-xs"
                                                            onChange={(e) => {
                                                                const newInputs = [...selectedElement.content.inputs];
                                                                newInputs[idx].placeY = e.target.value;
                                                                updateSelectedContent({ inputs: newInputs });
                                                            }}
                                                        >
                                                            <option value="manual">Manual (Use Y%)</option>
                                                            <option value="top">Top</option>
                                                            <option value="center">Center</option>
                                                            <option value="bottom">Bottom</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
