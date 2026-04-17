import { Customer, CustomerMeasurement, Settings, Order, Worker } from '@/db/database';
import { formatDate } from '@/utils/formatters';
import { formatMeasurementDisplay } from '@/utils/fractionUtils';
import { LayoutElement, WC_COLLAR_OPTIONS, DAMAN_OPTIONS } from '@/utils/slipLayout';

export const generateMeasurementSlipHTML = (
    customer: Customer,
    measurement: CustomerMeasurement,
    layout: LayoutElement[], // Now explicitly passed
    settings?: Settings,
    workerNames?: { cutter?: string; checker?: string; karigar?: string },
    order?: Order
): string => {

    const shopName = settings?.shopName || 'نظام ٹیلرز';
    const phone = settings?.phone1 || '0321-9062253';

    const getAbsoluteUrl = (path: string) => {
        try {
            return new URL(path.replace(/^\//, ''), window.location.href).href;
        } catch {
            return path;
        }
    };

    // Function to safely get field values
    const getVal = (key: string) => {
        if (key === 'sNo' && customer?.id) return String(customer.id);
        if (key === 'customerName' && customer?.name) return customer.name;
        if (key === 'karigar' && workerNames?.karigar) return workerNames.karigar;
        return formatMeasurementDisplay(measurement.fields[key] || '');
    };

    // Map through LayoutElements to generate absolute positioned HTML
    const layoutHTML = layout.map((element: LayoutElement) => {
        const baseStyle = `position: absolute; top: ${element.y}%; left: ${element.x}%; ${element.width ? `width: ${element.width}%;` : ''} ${element.height ? `height: ${element.height}%;` : ''}`;

        if (element.type === 'textBlock') {
            let contentStr = element.content;
            if (element.id === 'header_title') contentStr = shopName;
            if (element.id === 'header_subtitle') {
                const phoneStr = [settings?.phone1 || phone, settings?.phone2].filter(Boolean).join(' / ');
                const addressStr = settings?.address ? `\n${settings.address}` : '';
                contentStr = `Contact No: ${phoneStr}${addressStr}`;
            }

            const lines = contentStr.split('\n').map((l: string) => `<div>${l}</div>`).join('');
            const dirStyle = element.direction ? `direction: ${element.direction};` : '';
            const fontStyle = element.direction === 'rtl' ? `font-family: 'NotoNastaliqUrdu', serif;` : '';

            if (element.id === 'header_divider') {
                return `<div style="${baseStyle} background-color: ${element.color || '#cbd5e1'};"></div>`;
            }

            return `
                <div style="${baseStyle} display: flex; align-items: center; justify-content: center; text-align: center; font-weight: bold; font-size: ${element.fontSize || 14}px; color: ${element.color || '#0f172a'}; ${dirStyle} ${fontStyle}">
                    <div>${lines}</div>
                </div>
            `;
        }

        if (element.type === 'textArea') {
            const val = getVal(element.content.field) || '';
            const labelHtml = !element.content.hideLabel 
                ? `<div style="font-weight: 600; color: #475569; font-size: 13px; margin-bottom: 4px;">${element.content.label}</div>` 
                : '';
            
            return `
                <div style="${baseStyle} display: flex; flex-direction: column;">
                    ${labelHtml}
                    <div style="flex: 1; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 8px; font-size: 13px; font-weight: bold; color: #0f172a; white-space: pre-wrap; word-wrap: break-word; text-align: left; direction: ltr; overflow: hidden; line-height: 1.4;">${val}</div>
                </div>
            `;
        }

        if (element.type === 'input') {
            const val = getVal(element.content.field);
            const labelHtml = !element.content.hideLabel ? `<span style="font-weight: 600; color: #475569; padding: 0 6px; font-size: 13px; background: #fff; flex-shrink: 0; white-space: nowrap;">${element.content.label}</span>` : '';
            const isHeaderVal = ['sNo', 'customerName', 'suitQty', 'karigar'].includes(element.content.field);
            const valStyle = element.content.hideLabel
                ? `display: flex; align-items: center; justify-content: center; text-align: center; font-size: 16px;`
                : 'padding: 0 6px; font-size: 14px;';
            const borderHtml = element.content.dottedLine
                ? `<div style="position: absolute; left: 24px; right: 4px; bottom: 4px; border-bottom: 1px dashed #cbd5e1; z-index: 0;"></div>`
                : `<div style="position: absolute; left: 0; right: 0; bottom: 0; border-bottom: 1px solid #cbd5e1; z-index: 0;"></div>`;

            return `
                <div style="${baseStyle} display: flex; align-items: center; justify-content: center;">
                    ${labelHtml}
                    <div style="flex: 1; min-width: 0; width: 100%; color: #0f172a; font-weight: bold; position: relative; z-index: 10; ${valStyle}">
                        ${val}
                    </div>
                    ${borderHtml}
                </div>
            `;
        }

        // Conditional Rendering Logic for Shalwar Kameez Collar Toggle
        // If 'simple_collar' is selected, DO NOT print Ban Shape (13) and Ban Dropdown
        if ((element.id === 'svg_shape13' || element.type === 'banGroup') && measurement.fields['sk_collar_type'] === 'simple_collar') {
            return '';
        }
        // If 'ban_collar' is selected, DO NOT print Simple Collar Shape (14)
        if (element.id === 'svg_shape14' && (measurement.fields['sk_collar_type'] === 'ban_collar' || !measurement.fields['sk_collar_type'])) {
            return ''; // Note: 'ban_collar' is the default
        }

        if (element.type === 'skPattiKaajGroup') {
            if (measurement.fields['sk_patti_kaaj'] !== 'yes') return '';
            return `
                <div style="${baseStyle} display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 15px; font-weight: bold; font-family: 'NotoNastaliqUrdu', serif; color: #0f172a; white-space: nowrap; text-shadow: 1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff;">پٹی کاج ہو</span>
                </div>
            `;
        }

        if (element.type === 'svg') {
            const svgBase64 = element.content.raw
                ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(element.content.raw.replace(/\\n/g, ''))}`
                : getAbsoluteUrl(`/SVG/${element.content.asset}`); // Note: file path won't easily work in electron print unless baseUrl is mapped, but since these have RAW content loaded, it's fine.

            const inputsHtml = (element.content.inputs || []).map((inp: any) => {
                const valStr = (getVal(inp.id) || '').toString();
                const chWidth = Math.max(2.5, valStr.length + 0.5); // align print widths with UI

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

                return `
                    <div style="position: absolute; left: ${left}; top: ${top}; width: ${chWidth}ch; transform: ${transform}; text-align: center; color: #0f172a; font-size: 14px; font-weight: bold; z-index: 10;">
                        ${valStr}
                    </div>
                `;
            }).join('');

            return `
                <div style="${baseStyle}">
                    <img src="${svgBase64}" style="width: 100%; height: 100%; object-fit: contain; filter: brightness(0) saturate(100%) invert(32%) sepia(13%) saturate(831%) hue-rotate(176deg) brightness(95%) contrast(88%);" />
                    ${inputsHtml}
                </div>
            `;
        }

        if (element.type === 'damanGroup') {
            const options = element.content?.options || [
                { key: 'daman_curved', asset: 'Asset 3.svg', labelUr: 'گول دامن' }, // Fallbacks just in case
                { key: 'daman_straight', asset: 'Asset 2.svg', labelUr: 'سیدھا دامن' },
            ];

            const dbOption = options.find((opt: any) => measurement.fields['daman_selected'] === opt.key);
            const selectedOption = DAMAN_OPTIONS.find(o => o.key === dbOption?.key) || dbOption;
            if (!selectedOption) return '';

            const svgBase64 = selectedOption.raw 
                ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(selectedOption.raw.replace(/\n/g, ''))}` 
                : getAbsoluteUrl(`/SVG/${selectedOption.asset}`);

            return `
                <div style="${baseStyle} display: flex; align-items: center; justify-content: center;">
                    <div style="display: flex; flex-direction: column; align-items: center;">
                         <img src="${svgBase64}" style="width: 40px; height: 32px; object-fit: contain; filter: brightness(0) saturate(100%) invert(32%) sepia(13%) saturate(831%) hue-rotate(176deg) brightness(95%) contrast(88%);" />
                        <span style="font-size: 11px; font-weight: 600; margin-top: 4px; color: #0f172a; white-space: nowrap; font-family: 'NotoNastaliqUrdu', serif;">
                            ${selectedOption.labelUr || selectedOption.label || ''}
                        </span>
                        <div style="width: 18px; height: 18px; border: 1.5px solid #0f172a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; margin-top: 4px; color: #0f172a; font-weight: bold;">
                            ✓
                        </div>
                    </div>
                </div>
            `;
        }

        if (element.type === 'silaiGroup') {
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

            const selectedOption = options.find((opt: any) => measurement.fields['silai_selected'] === opt.key);
            if (!selectedOption) return '';

            return `
                <div style="${baseStyle} display: flex; align-items: center; justify-content: flex-end;">
                     <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 18px; height: 18px; border: 1.5px solid #0f172a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #0f172a; font-weight: bold;">
                            ✓
                        </div>
                        <span dir="rtl" style="font-size: 14px; font-weight: 600; font-family: 'NotoNastaliqUrdu', serif; white-space: nowrap; color: #0f172a;">${selectedOption.labelUr || selectedOption.label || ''}</span>
                    </div>
                </div>
            `;
        }

        if (element.type === 'banGroup') {
            const options = element.content?.options || [
                { key: 'ban_half_gol', labelUr: 'ہاف گول' },
                { key: 'ban_half_seedha', labelUr: 'ہاف سیدھا' },
                { key: 'ban_full_gol', labelUr: 'فل گول' },
                { key: 'ban_full_seedha', labelUr: 'فل سیدھا' },
            ];

            const selectedOption = options.find((opt: any) => measurement.fields['ban_selected'] === opt.key);
            if (!selectedOption) return '';

            return `
                <div style="${baseStyle} display: flex; align-items: center; justify-content: flex-end;">
                     <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 18px; height: 18px; border: 1.5px solid #0f172a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #0f172a; font-weight: bold;">
                            ✓
                        </div>
                        <span dir="rtl" style="font-size: 14px; font-weight: 600; font-family: 'NotoNastaliqUrdu', serif; white-space: nowrap; color: #0f172a;">${selectedOption.labelUr || selectedOption.label || ''}</span>
                    </div>
                </div>
            `;
        }

        if (element.type === 'cuffGroup') {
            const options = element.content?.options || [
                { key: 'cuff_fold', labelUr: 'فولڈ کف', label: 'Fold Cuff' },
                { key: 'cuff_seedha', labelUr: 'سیدھا کف', label: 'Seedha Cuff' },
                { key: 'cuff_gol', labelUr: 'گول کف', label: 'Gol Cuff' },
                { key: 'cuff_cut', labelUr: 'کٹ کف', label: 'Cut Cuff' },
            ];

            const selectedOption = options.find((opt: any) => measurement.fields['cuff_selected'] === opt.key);
            if (!selectedOption) return '';

            return `
                <div style="${baseStyle} display: flex; align-items: center; justify-content: flex-end;">
                     <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 18px; height: 18px; border: 1.5px solid #0f172a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #0f172a; font-weight: bold;">
                            ✓
                        </div>
                        <span dir="rtl" style="font-size: 14px; font-weight: 600; font-family: 'NotoNastaliqUrdu', serif; white-space: nowrap; color: #0f172a;">${selectedOption.labelUr || selectedOption.label || ''}</span>
                    </div>
                </div>
            `;
        }

        if (element.type === 'buttonDesignGroup') {
            const options = element.content?.options || [
                { key: 'btn_tak', labelUr: 'ٹک بٹن', label: 'Tak Button' },
                { key: 'btn_steel', labelUr: 'سٹیل بٹن', label: 'Steel Button' },
                { key: 'btn_ring', labelUr: 'رنگ بٹن', label: 'Ring Button' },
                { key: 'btn_vip', labelUr: 'وی آئی پی بٹن', label: 'VIP Button' },
            ];

            const selectedOption = options.find((opt: any) => measurement.fields['button_design_selected'] === opt.key);
            if (!selectedOption) return '';

            return `
                <div style="${baseStyle} display: flex; align-items: center; justify-content: flex-end;">
                     <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 18px; height: 18px; border: 1.5px solid #0f172a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #0f172a; font-weight: bold;">
                            ✓
                        </div>
                        <span dir="rtl" style="font-size: 14px; font-weight: 600; font-family: 'NotoNastaliqUrdu', serif; white-space: nowrap; color: #0f172a;">${selectedOption.labelUr || selectedOption.label || ''}</span>
                    </div>
                </div>
            `;
        }

        if (element.type === 'wcCollarGroup') {
            const options = element.content?.options || WC_COLLAR_OPTIONS;

            const dbOption = options.find((opt: any) => measurement.fields['wc_collar_selected'] === opt.key);
            const selectedOption = WC_COLLAR_OPTIONS.find(o => o.key === dbOption?.key) || dbOption;
            if (!selectedOption) return '';

            const svgBase64 = selectedOption.raw 
                ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(selectedOption.raw.replace(/\n/g, ''))}` 
                : getAbsoluteUrl(`/SVG/${selectedOption.asset}`);

            // Render the full size Waistcoat Collar SVG instead of a text label
            return `
                <div style="${baseStyle} display: flex; align-items: center; justify-content: center; position: relative;">
                     <img src="${svgBase64}" style="width: 100%; height: 100%; object-fit: contain; filter: brightness(0) saturate(100%) invert(32%) sepia(13%) saturate(831%) hue-rotate(176deg) brightness(95%) contrast(88%);" />
                </div>
            `;
        }

        if (element.type === 'wcGeraGroup') {
            const options = element.content?.options || [
                { key: 'wc_gera_gol', labelUr: 'گول گیرا' },
                { key: 'wc_gera_seedha', labelUr: 'سیدھا گیرا' },
            ];

            const selectedOption = options.find((opt: any) => measurement.fields['wc_gera_selected'] === opt.key);
            if (!selectedOption) return '';

            return `
                <div style="${baseStyle} display: flex; align-items: center; justify-content: flex-end;">
                     <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 18px; height: 18px; border: 1.5px solid #0f172a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #0f172a; font-weight: bold;">
                            ✓
                        </div>
                        <span dir="rtl" style="font-size: 14px; font-weight: 600; font-family: 'NotoNastaliqUrdu', serif; white-space: nowrap; color: #0f172a;">${selectedOption.labelUr}</span>
                    </div>
                </div>
            `;
        }

        if (element.type === 'coatDoublePressGroup') {
            if (measurement.fields['coat_double_press'] !== 'yes') return '';
            return `
                <div style="${baseStyle} display: flex; align-items: center; justify-content: flex-end;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 18px; height: 18px; border: 1.5px solid #0f172a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #0f172a; font-weight: bold;">
                            ✓
                        </div>
                        <span dir="rtl" style="font-size: 14px; font-weight: 600; font-family: 'NotoNastaliqUrdu', serif; white-space: nowrap; color: #0f172a;">ڈبل پریس</span>
                    </div>
                </div>
            `;
        }

        if (element.type === 'coatButtonGroup') {
            const options = element.content?.options || [
                { key: 'coat_1_button', labelUr: '1 بٹن' },
                { key: 'coat_2_button', labelUr: '2 بٹن' },
            ];
            const selectedOption = options.find((opt: any) => measurement.fields['coat_button_selected'] === opt.key);
            if (!selectedOption) return '';
            return `
                <div style="${baseStyle} display: flex; align-items: center; justify-content: flex-end;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 18px; height: 18px; border: 1.5px solid #0f172a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #0f172a; font-weight: bold;">
                            ✓
                        </div>
                        <span dir="rtl" style="font-size: 14px; font-weight: 600; font-family: 'NotoNastaliqUrdu', serif; white-space: nowrap; color: #0f172a;">${selectedOption.labelUr}</span>
                    </div>
                </div>
            `;
        }

        if (element.type === 'coatChaakGroup') {
            const options = element.content?.options || [
                { key: 'coat_band_chaak', labelUr: 'بند چاک' },
                { key: 'coat_2_chaak', labelUr: '2 چاک' },
            ];
            const selectedOption = options.find((opt: any) => measurement.fields['coat_chaak_selected'] === opt.key);
            if (!selectedOption) return '';
            return `
                <div style="${baseStyle} display: flex; align-items: center; justify-content: flex-end;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 18px; height: 18px; border: 1.5px solid #0f172a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #0f172a; font-weight: bold;">
                            ✓
                        </div>
                        <span dir="rtl" style="font-size: 14px; font-weight: 600; font-family: 'NotoNastaliqUrdu', serif; white-space: nowrap; color: #0f172a;">${selectedOption.labelUr}</span>
                    </div>
                </div>
            `;
        }

        return '';
    }).join('');

    const workerSummary = [
        workerNames?.cutter ? `C: ${workerNames.cutter}` : '',
        workerNames?.checker ? `K: ${workerNames.checker}` : '',
        workerNames?.karigar ? `A: ${workerNames.karigar}` : '',
    ].filter(Boolean).join(' | ');

    return `
<!DOCTYPE html>
<html lang="ur">
<head>
    <meta charset="UTF-8">
    <title>Measurement Slip - ${customer.name}</title>
    <style>
        /* load Urdu Nastaleeq font */
        @font-face {
            font-family: 'NotoNastaliqUrdu';
            src: url('${getAbsoluteUrl('/fonts/NotoNastaliqUrdu-Regular.ttf')}') format('truetype');
            font-weight: 400; font-style: normal; font-display: swap;
        }
        @font-face {
            font-family: 'NotoNastaliqUrdu';
            src: url('${getAbsoluteUrl('/fonts/NotoNastaliqUrdu-Medium.ttf')}') format('truetype');
            font-weight: 500; font-style: normal; font-display: swap;
        }
        @font-face {
            font-family: 'NotoNastaliqUrdu';
            src: url('${getAbsoluteUrl('/fonts/NotoNastaliqUrdu-SemiBold.ttf')}') format('truetype');
            font-weight: 600; font-style: normal; font-display: swap;
        }
        @font-face {
            font-family: 'NotoNastaliqUrdu';
            src: url('${getAbsoluteUrl('/fonts/NotoNastaliqUrdu-Bold.ttf')}') format('truetype');
            font-weight: bold; font-style: normal; font-display: swap;
        }
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            background: #fff;
            color: #111;
            direction: ltr; /* Keeping it LTR for layout */
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
        }

        .slip-container {
            width: 500px;
            height: ${settings?.slipPageSize === 'A4' ? '707px' : '700px'}; /* Fixed height for absolute mapping */
            border: 1px solid #cbd5e1;
            background: #fff;
            position: relative;
        }

        .action-bar {
            position: fixed; top: 20px; right: 20px; display: flex; gap: 10px; z-index: 9999;
        }
        @media print {
            body { 
                background: #fff; 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
                padding: 0;
                transform: scale(0.95);
                transform-origin: top center;
                height: 98vh;
                overflow: hidden;
            }
            @page { size: ${settings?.slipPageSize === 'A4' ? 'A4' : 'A5'}; margin: 0; }
            .action-bar { display: none !important; }
            .slip-container { width: 100%; border: none; }
        }
    </style>
</head>
<body>

<script>
        // Debugging the API
        console.log('previewAPI status:', window.previewAPI);
    </script>
    <div class="action-bar">
        <button onclick="window.print()" style="padding: 10px 20px; background: #0ea5e9; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">Print</button>
        <button id="save-pdf-btn" onclick="if(window.previewAPI && window.previewAPI.savePDF) { window.previewAPI.savePDF().then(res => { if(res && !res.success && !res.canceled) alert('Error saving PDF: ' + res.error); }) } else { alert('Save PDF feature unavailable. This requires the Electron desktop app. Details: previewAPI is ' + typeof window.previewAPI) }" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-left: 10px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">Save PDF</button>
    <button onclick="window.close()" style="padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-left: 10px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">Close</button>
</div>

<div class="slip-container">
    ${layoutHTML}
</div>

<div class="footer-details" style="width: 500px; padding: 10px; margin-top: 5px; font-size: 14px; color: #555; text-align: right; direction: rtl; border-top: 1px dashed #ccc;">
    <div style="margin-bottom: 8px; font-size: 12px; color: #475569; text-align: center; font-family: 'NotoNastaliqUrdu', serif;">
        رسید گم ہو جانے پر اگر عدد میں کسی قسم کی بھی غلطی ہوئی تو اس کا ذمہ دار کاریگر ہوگا۔
    </div>
    <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
        ${order ? `<div style="margin-bottom: 4px;"><strong>آرڈر #:</strong> ${order.id} | <strong>تاریخ:</strong> ${formatDate(order.createdAt)} - ${formatDate(order.dueDate)}</div>` : ''}
        ${order?.advancePayment ? `<div style="margin-bottom: 4px;"><strong>ایڈوانس:</strong> ${order.advancePayment}</div>` : ''}
    </div>
    <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
        ${workerSummary ? `<div style="margin-bottom: 4px;"><strong>کاریگر:</strong> ${workerSummary}</div>` : ''}
        ${order?.deliveryNotes ? `<div style="margin-bottom: 4px;"><strong>نوٹس:</strong> ${order.deliveryNotes}</div>` : ''}
    </div>
</div>

</body>
</html>
    `;
};

export const generateKarigarReportHTML = (
    worker: Worker,
    orders: (Order & { customerName: string, designSpecsEn: string[], designSpecsUr: string[] })[],
    dateRange: { start: Date; end: Date }
): string => {

    const getAbsoluteUrl = (path: string) => {
        try {
            return new URL(path.replace(/^\//, ''), window.location.href).href;
        } catch {
            return path;
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-GB'); // DD/MM/YYYY
    };

    // Calculate suit counts per customer
    const customerCounts: Record<string, number> = {};
    orders.forEach(o => {
        customerCounts[o.customerName] = (customerCounts[o.customerName] || 0) + 1;
    });

    let tableRows = '';
    orders.forEach(order => {
        // Use Urdu specs if available
        const specsToUse = order.designSpecsUr && order.designSpecsUr.length > 0
            ? order.designSpecsUr
            : order.designSpecsEn; // Fallback

        const specs = specsToUse.length > 0
            ? specsToUse.join('، ')
            : '-';

        // Translate status
        const statusMap: Record<string, string> = {
            'new': 'نیا',
            'in_progress': 'جاری ہے',
            'ready': 'تیار',
            'delivered': 'پہنچا',
            'completed': 'مکمل'
        };
        const statusUr = statusMap[order.status] || order.status;

        // Count for this customer
        // Use suit count from order, default to 1
        const count = order.suitsCount || 1;

        tableRows += `
            <tr>
                <td style="text-align: center;">${formatDate(order.createdAt)}</td>
                <td style="text-align: center;">${order.id}</td>
                <td>
                    <div style="font-weight: bold;">${order.customerName}</div>
                </td>
                <td style="text-align: center; font-weight: bold;">${count}</td>
                <td>${specs}</td>
                <td style="text-align: center;">
                    <span class="status-badge ${order.status}">${statusUr}</span>
                </td>
            </tr>
        `;
    });

    const totalSuits = orders.reduce((sum, o) => sum + (o.suitsCount || 1), 0);

    return `
<!DOCTYPE html>
<html lang="ur">
<head>
    <meta charset="UTF-8">
    <title>Karigar Report - ${worker.name}</title>
    <style>
        @font-face {
            font-family: 'NotoNastaliqUrdu';
            src: url('${getAbsoluteUrl('/fonts/NotoNastaliqUrdu-Regular.ttf')}') format('truetype');
            font-weight: 400; font-style: normal; font-display: swap;
        }
        @font-face {
            font-family: 'NotoNastaliqUrdu';
            src: url('${getAbsoluteUrl('/fonts/NotoNastaliqUrdu-Medium.ttf')}') format('truetype');
            font-weight: 500; font-style: normal; font-display: swap;
        }
        @font-face {
            font-family: 'NotoNastaliqUrdu';
            src: url('${getAbsoluteUrl('/fonts/NotoNastaliqUrdu-SemiBold.ttf')}') format('truetype');
            font-weight: 600; font-style: normal; font-display: swap;
        }
        @font-face {
            font-family: 'NotoNastaliqUrdu';
            src: url('${getAbsoluteUrl('/fonts/NotoNastaliqUrdu-Bold.ttf')}') format('truetype');
            font-weight: bold; font-style: normal; font-display: swap;
        }
        body {
            font-family: 'NotoNastaliqUrdu', serif;
            direction: rtl;
            background: #fff;
            padding: 10px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }
        .shop-name { font-size: 24px; font-weight: bold; margin-bottom: 2px; }
        .shop-info { font-size: 12px; color: #555; }
        
        .report-title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            background: #f0f0f0;
            padding: 5px;
            border-radius: 6px;
        }

        .meta-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
            font-weight: 600;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px; /* Dense font */
        }

        th, td {
            border: 1px solid #ccc;
            padding: 4px; /* Dense padding */
            vertical-align: middle;
        }

        th {
            background: #f9f9f9;
            font-weight: bold;
            font-size: 13px;
        }

        .footer {
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            padding-top: 10px;
            border-top: 1px dashed #ccc;
            font-size: 14px;
        }

        .status-badge {
            font-size: 11px;
            padding: 1px 5px;
            border-radius: 4px;
        }
        .status-badge.completed { background: #dcfce7; color: #166534; }
        .status-badge.delivered { background: #f3f4f6; color: #374151; }
        .status-badge.new { background: #dbeafe; color: #1e40af; }
        .status-badge.in_progress { background: #fef9c3; color: #854d0e; }

        .action-bar {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: #fff;
            padding: 12px 25px;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05);
            display: flex;
            gap: 20px;
            z-index: 9999;
        }

        .btn-3d {
            border: 1px solid rgba(0,0,0,0.1);
            border-bottom-width: 4px;
            padding: 10px 24px;
            border-radius: 10px;
            cursor: pointer;
            font-family: inherit;
            font-weight: 700;
            font-size: 15px;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.1s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .btn-3d:active {
            border-bottom-width: 1px;
            transform: translateY(3px);
            margin-top: 3px;
            box-shadow: inset 0 2px 5px rgba(0,0,0,0.1);
        }

        .btn-3d.primary {
            background: #0ea5e9;
            color: white;
            border-color: #0284c7;
            border-bottom-color: #0369a1;
            text-shadow: 0 1px 1px rgba(0,0,0,0.2);
        }
        
        .btn-3d.primary:hover {
            background: #0284c7;
        }

        .btn-3d.danger {
            background: #ef4444;
            color: white;
            border-color: #dc2626;
            border-bottom-color: #b91c1c;
            text-shadow: 0 1px 1px rgba(0,0,0,0.2);
        }
        
        .btn-3d.danger:hover {
            background: #dc2626;
        }

        /* Page Container - A5 Portrait */
        .slip {
            width: 148mm;
            min-height: 210mm;
            margin: 10mm auto;
            padding: 8mm 6mm; /* Slightly tighter padding for A5 */
            background: #fff;
            border: 3px dashed #c00; /* Red Border for Preview */
            position: relative;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }

        @page {
            size: A5 portrait; /* Explicit A5 */
            margin: 0;
        }

        @media print {
            body {
                background: #fff;
                margin: 0;
            }
            .slip {
                width: 100%;
                min-height: auto;
                margin: 0;
                padding: 10mm;
                border: none; /* No border in PDF */
                box-shadow: none;
            }
            .action-bar { display: none !important; }
        }
    </style>
</head>
<body>

    <div class="action-bar">
        <button onclick="window.print()" class="btn-3d primary">
            <span>Print Report</span>
        </button>
        <button onclick="if(window.previewAPI && window.previewAPI.savePDF) { window.previewAPI.savePDF().then(res => { if(res && !res.success && !res.canceled) alert('Error saving PDF: ' + res.error); }) } else { alert('Save PDF feature unavailable. This requires the Electron desktop app.') }" style="padding: 0 25px; height: 42px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; border: none; transition: all 0.2s; background: #10b981; color: white;">
            <span>Save PDF</span>
        </button>
        <button onclick="window.close()" class="btn-3d danger">
            <span>Close</span>
        </button>
    </div>

    <div class="slip">

        <div class="report-title">
            کاریگر ہفتہ وار رپورٹ
        </div>

        <div class="meta-info">
            <div>کاریگر کا نام: <span style="font-size: 16px; color: #0284c7;">${worker.name}</span></div>
            <div style="direction: ltr;">
                ${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th width="12%">تاریخ</th>
                    <th width="8%">آرڈر #</th>
                    <th width="20%">کسٹمر</th>
                    <th width="8%">کل سوٹ</th>
                    <th width="37%">ڈیزائن / فرمائش</th>
                    <th width="15%">اسٹیٹس</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>

        <div style="margin-top: 15px; text-align: left; font-weight: bold; font-size: 15px;">
            ٹوٹل جوڑے: ${totalSuits}
        </div>

        <div class="footer">
            <div>دستخط کاریگر: _________________</div>
            <div>دستخط منیجر: _________________</div>
        </div>

    </div>

</body>
</html>
    `;
};
