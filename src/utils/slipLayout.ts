export interface NumberedFieldDef {
    key: string;
    number: number;
}

export interface ShapeInputDef {
    id: string;
    relX: number; // percentage X relative to shape width
    relY: number; // percentage Y relative to shape height
    width: number;
    placeX?: 'left' | 'center' | 'right' | 'manual';
    placeY?: 'top' | 'center' | 'bottom' | 'manual';
}

export interface ShapeFieldDef {
    key: string;
    number: number;
    asset: string;
    raw?: string; // inline SVG text for printing
    top: number;
    left: number;
    width: number;
    height: number;
    defaultInputs: ShapeInputDef[];
}

export interface LayoutElement {
    id: string; // Unique identifier (e.g., 'shape14', 'left1', 'cField', 'header_mob')
    type: 'svg' | 'input' | 'label' | 'damanGroup' | 'silaiGroup' | 'banGroup' | 'textBlock' | 'wcCollarGroup' | 'wcGeraGroup' | 'coatDoublePressGroup' | 'coatButtonGroup' | 'coatChaakGroup' | 'skCollarToggleGroup' | 'skPattiKaajGroup' | 'textArea' | 'cuffGroup' | 'buttonDesignGroup';
    x: number; // Left position (percentage or px depending on engine; let's stick to percentage since the original was percentage)
    y: number; // Top position (percentage)
    width?: number; // Width (percentage)
    height?: number; // Height (percentage)
    content?: any; // To store asset URL, raw SVG, text label, etc. Inputs will be { asset: string, raw: string, inputs: ShapeInputDef[] }
    fontSize?: number; // Optional styling
    color?: string;
    borderColor?: string;
    isFixed?: boolean;
    direction?: 'rtl' | 'ltr';
}

export const LEFT_NUMBERED_FIELDS: NumberedFieldDef[] = Array.from({ length: 11 }, (_, index) => ({
    key: `left${index + 1}`,
    number: index + 1,
}));

export const HEADER_FIELDS = [
    { key: 'sNo', label: 'S.No.' },
    { key: 'customerName', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'karigar', label: 'Karigar' },
];

// Raw SVG imports for embedding in printed HTML
import asset1Raw from '/SVG/Asset 1.svg?raw';
import asset2Raw from '/SVG/Asset 2.svg?raw';
import asset3Raw from '/SVG/Asset 3.svg?raw';
import asset7Raw from '/SVG/Asset 7.svg?raw';
import asset8Raw from '/SVG/Asset 8.svg?raw';
import asset9Raw from '/SVG/Asset 9.svg?raw';
import asset10Raw from '/SVG/Asset 10.svg?raw';
import asset12Raw from '/SVG/Asset 12.svg?raw';
import asset13Raw from '/SVG/Asset 13.svg?raw';
import asset14Raw from '/SVG/Asset 14.svg?raw';
import asset6Raw from '/SVG/Asset 6.svg?raw';

import wcBanCollarRaw from '/SVG/WaistCoat/Ban_Collar.svg?raw';
import wcGolCollarRaw from '/SVG/WaistCoat/Gol_Collar.svg?raw';
import wcVShapedRaw from '/SVG/WaistCoat/V_Shaped.svg?raw';

export const SHAPE_FIELDS: ShapeFieldDef[] = [
    // Row 1: Collar (Asset 14) — full width, very top
    {
        key: 'shape14', number: 14, asset: 'Asset 14.svg', raw: asset14Raw, top: 22.24, left: 39.4, width: 53.3, height: 9.6,
        defaultInputs: [
            { id: 'shape14_1', relX: 0, relY: 0, width: 25, placeX: 'center', placeY: 'top' },
            { id: 'shape14_2', relX: 75, relY: 50, width: 25 }
        ]
    },
    // Row 2: Curved band (Asset 13) — full width, below collar
    {
        key: 'shape13', number: 13, asset: 'Asset 13.svg', raw: asset13Raw, top: 39.64, left: 39.19, width: 55.2, height: 5.71,
        defaultInputs: [
            { id: 'shape13_1', relX: 0, relY: 16, width: 25, placeX: 'center', placeY: 'manual' },
            { id: 'shape13_2', relX: 75, relY: 50, width: 25 }
        ]
    },

    // Row 3: T-shape placket (Asset 10) — center, wider
    {
        key: 'shape10', number: 10, asset: 'Asset 10.svg', raw: asset10Raw, top: 48.55, left: 46.6, width: 29.79, height: 12.71,
        defaultInputs: [
            { id: 'shape10_1', relX: 10, relY: 18, width: 20, placeX: 'center' },
            { id: 'svg_shape10_2', relX: 77, relY: 57, width: 20 }
        ]
    },
    // Vertical cuff rect (Asset 12) — far right, same row
    {
        key: 'shape12', number: 12, asset: 'Asset 12.svg', raw: asset12Raw, top: 51.12, left: 81.1, width: 5.8, height: 14.28,
        defaultInputs: [
            { id: 'shape12_1', relX: 150, relY: -11, width: 200, placeY: 'top', placeX: 'manual' },
            { id: 'svg_shape12_2', relX: 150, relY: 50, width: 200 },
            { id: 'svg_shape12_3', relX: 150, relY: 87, width: 200 }
        ]
    },

    // Row 4: Line w/ circles (Asset 9) — center-left
    {
        key: 'shape9', number: 9, asset: 'Asset 9.svg', raw: asset9Raw, top: 44, left: 25, width: 10, height: 20,
        defaultInputs: [
            { id: 'svg_shape9_1', relX: -27, relY: 9, width: 30 },
            { id: 'svg_shape9_2', relX: -27, relY: 49, width: 30 },
            { id: 'svg_shape9_3', relX: -26, relY: 89, width: 30 }
        ]
    },
    // Triangle (Asset 1) — center-right
    {
        key: 'shape1', number: 1, asset: 'Asset 1.svg', raw: asset1Raw, top: 66.7, left: 66.1, width: 27.2, height: 10.42,
        defaultInputs: [
            { id: 'shape1_1', relX: 0, relY: 0, width: 40, placeX: 'center', placeY: 'center' }
        ]
    },
    // Row 5: Plain square (Asset 8) — center-left
    {
        key: 'shape8', number: 8, asset: 'Asset 8.svg', raw: asset8Raw, top: 81.38, left: 35.04, width: 18.8, height: 13.14,
        defaultInputs: [
            { id: 'shape8_1', relX: 0, relY: 0, width: 80, placeY: 'center', placeX: 'center' }
        ]
    },
    // Notched square (Asset 7) — center-right
    {
        key: 'shape7', number: 7, asset: 'Asset 7.svg', raw: asset7Raw, top: 81.38, left: 54.9, width: 23.59, height: 13.28,
        defaultInputs: [
            { id: 'shape7_1', relX: 33, relY: 16, width: 50, placeX: 'manual', placeY: 'manual' },
            { id: 'svg_shape7_2', relX: 70, relY: 16, width: 50 }
        ]
    },
    // Missing Asset 6
    {
        key: 'shape6', number: 6, asset: 'Asset 6.svg', raw: asset6Raw, top: 40, left: 10, width: 15, height: 15,
        defaultInputs: [
            { id: 'shape6_1', relX: 0, relY: 0, width: 100, placeX: 'center', placeY: 'center' }
        ]
    },
];

export const DEFAULT_WAISTCOAT_LAYOUT: LayoutElement[] = [
    // --- Header Block (approx Top 12%) ---
    { id: 'header_title', type: 'textBlock', x: 0, y: 2, width: 100, content: 'نظام ٹیلرز', fontSize: 36, color: '#0f172a', isFixed: true },
    { id: 'header_subtitle', type: 'textBlock', x: 0, y: 8, width: 100, content: 'Contact No:', fontSize: 12, color: '#64748b', isFixed: true },

    // Divider Line
    { id: 'header_divider', type: 'textBlock', x: 2, y: 12, width: 96, height: 0.2, content: '', color: '#cbd5e1', isFixed: true },

    // --- Left Column Header (approx Top 14%) ---
    // Header labels row
    { id: 'header_label_sno', type: 'textBlock', x: 2, y: 14, width: 15, content: 'S.No.', fontSize: 12, color: '#475569', isFixed: true },
    { id: 'header_label_name', type: 'textBlock', x: 18, y: 14, width: 30, content: 'Name', fontSize: 12, color: '#475569', isFixed: true },
    { id: 'header_label_suitQty', type: 'textBlock', x: 50, y: 14, width: 20, content: 'Suit Qty', fontSize: 12, color: '#475569', isFixed: true },
    { id: 'header_label_karigar', type: 'textBlock', x: 72, y: 14, width: 20, content: 'Karigar', fontSize: 12, color: '#475569', isFixed: true },

    // Header values row (tightened to remove vertical gap)
    { id: 'header_val_sno', type: 'input', x: 2, y: 15, width: 15, height: 4.5, content: { label: '', field: 'sNo', hideLabel: true }, isFixed: true },
    { id: 'header_val_name', type: 'input', x: 18, y: 15, width: 30, height: 4.5, content: { label: '', field: 'customerName', hideLabel: true }, isFixed: true },
    { id: 'header_val_suitQty', type: 'input', x: 50, y: 15, width: 20, height: 4.5, content: { label: '', field: 'suitQty', hideLabel: true }, isFixed: true },
    { id: 'header_val_karigar', type: 'input', x: 72, y: 15, width: 20, height: 4.5, content: { label: '', field: 'karigar', hideLabel: true }, isFixed: true },

    // --- Waistcoat Numbered Inputs ---
    { id: 'left1', type: 'input', x: 2, y: 19.5, width: 15, height: 4.5, content: { label: '1', field: 'wc_left1', hideLabel: true } },
    { id: 'left2', type: 'input', x: 2, y: 24, width: 15, height: 4.5, content: { label: '2', field: 'wc_left2', hideLabel: true } },
    { id: 'left3', type: 'input', x: 2, y: 28.5, width: 15, height: 4.5, content: { label: '3', field: 'wc_left3', hideLabel: true } },
    { id: 'left4', type: 'input', x: 2, y: 33, width: 15, height: 4.5, content: { label: '4', field: 'wc_left4', hideLabel: true } },
    { id: 'left5', type: 'input', x: 2, y: 37.5, width: 15, height: 4.5, content: { label: '5', field: 'wc_left5', hideLabel: true } },
    { id: 'left6', type: 'input', x: 2, y: 42, width: 15, height: 4.5, content: { label: '6', field: 'wc_left6', hideLabel: true } },
    { id: 'left7', type: 'input', x: 2, y: 46.5, width: 15, height: 4.5, content: { label: '7', field: 'wc_left7', hideLabel: true } },

    // Waistcoat Collar Dropdown Group
    { id: 'wc_collar_select', type: 'wcCollarGroup', x: 29.2, y: 25.29, width: 56.8, height: 21.43, content: { field: 'wc_collar_selected' } },

    // Waistcoat Gera Dropdown Group
    { id: 'wc_gera_select', type: 'wcGeraGroup', x: 39.2, y: 51.57, width: 34.6, height: 6.14, content: { field: 'wc_gera_selected' } },

    // Additional Notes Area
    { id: 'wc_notes_area', type: 'textArea', x: 2, y: 70, width: 96, height: 10, content: { label: 'Waistcoat Details / Notes', field: 'wc_other_details' } }
];

export const DEFAULT_COAT_LAYOUT: LayoutElement[] = [
    // --- Header Block (approx Top 12%) ---
    { id: 'header_title', type: 'textBlock', x: 0, y: 2, width: 100, content: 'نظام ٹیلرز', fontSize: 36, color: '#0f172a', isFixed: true },
    { id: 'header_subtitle', type: 'textBlock', x: 0, y: 8, width: 100, content: 'Contact No:', fontSize: 12, color: '#64748b', isFixed: true },

    // Divider Line
    { id: 'header_divider', type: 'textBlock', x: 2, y: 12, width: 96, height: 0.2, content: '', color: '#cbd5e1', isFixed: true },

    // --- Left Column Header (approx Top 14%) ---
    // Header labels row
    { id: 'header_label_sno', type: 'textBlock', x: 2, y: 14, width: 15, content: 'S.No.', fontSize: 12, color: '#475569', isFixed: true },
    { id: 'header_label_name', type: 'textBlock', x: 18, y: 14, width: 30, content: 'Name', fontSize: 12, color: '#475569', isFixed: true },
    { id: 'header_label_suitQty', type: 'textBlock', x: 50, y: 14, width: 20, content: 'Suit Qty', fontSize: 12, color: '#475569', isFixed: true },
    { id: 'header_label_karigar', type: 'textBlock', x: 72, y: 14, width: 20, content: 'Karigar', fontSize: 12, color: '#475569', isFixed: true },

    // Header values row (tightened to remove vertical gap)
    { id: 'header_val_sno', type: 'input', x: 2, y: 15, width: 15, height: 4.5, content: { label: '', field: 'sNo', hideLabel: true }, isFixed: true },
    { id: 'header_val_name', type: 'input', x: 18, y: 15, width: 30, height: 4.5, content: { label: '', field: 'customerName', hideLabel: true }, isFixed: true },
    { id: 'header_val_suitQty', type: 'input', x: 50, y: 15, width: 20, height: 4.5, content: { label: '', field: 'suitQty', hideLabel: true }, isFixed: true },
    { id: 'header_val_karigar', type: 'input', x: 72, y: 15, width: 20, height: 4.5, content: { label: '', field: 'karigar', hideLabel: true }, isFixed: true },

    // --- Coat Numbered Inputs ---
    { id: 'left1', type: 'input', x: 2, y: 19.5, width: 15, height: 4.5, content: { label: '1', field: 'coat_left1', hideLabel: true } },
    { id: 'left2', type: 'input', x: 2, y: 24, width: 15, height: 4.5, content: { label: '2', field: 'coat_left2', hideLabel: true } },
    { id: 'left3', type: 'input', x: 2, y: 28.5, width: 15, height: 4.5, content: { label: '3', field: 'coat_left3', hideLabel: true } },
    { id: 'left4', type: 'input', x: 2, y: 33, width: 15, height: 4.5, content: { label: '4', field: 'coat_left4', hideLabel: true } },
    { id: 'left5', type: 'input', x: 2, y: 37.5, width: 15, height: 4.5, content: { label: '5', field: 'coat_left5', hideLabel: true } },
    { id: 'left6', type: 'input', x: 2, y: 42, width: 15, height: 4.5, content: { label: '6', field: 'coat_left6', hideLabel: true } },
    { id: 'left7', type: 'input', x: 2, y: 46.5, width: 15, height: 4.5, content: { label: '7', field: 'coat_left7', hideLabel: true } },

    // Coat Double Press Checkbox (right side)
    { id: 'coat_double_press', type: 'coatDoublePressGroup', x: 40, y: 22, width: 55, height: 5, content: { field: 'coat_double_press' } },

    // Coat Button Count Radio - 1 Button / 2 Button (right side)
    { id: 'coat_button_select', type: 'coatButtonGroup', x: 40, y: 30, width: 55, height: 5, content: { field: 'coat_button_selected' } },

    // Coat Chaak Type Radio - Band Chaak / 2 Chaak (right side)
    { id: 'coat_chaak_select', type: 'coatChaakGroup', x: 40, y: 38, width: 55, height: 5, content: { field: 'coat_chaak_selected' } },

    // Additional Notes Area
    { id: 'coat_notes_area', type: 'textArea', x: 2, y: 55, width: 96, height: 10, content: { label: 'Coat Details / Notes', field: 'coat_other_details' } }
];

export const DAMAN_OPTIONS = [
    { key: 'daman_curved', asset: 'Asset 3.svg', raw: asset3Raw, labelUr: 'گول دامن' },
    { key: 'daman_straight', asset: 'Asset 2.svg', raw: asset2Raw, labelUr: 'سیدھا دامن' },
];

export const SILAI_OPTIONS = [
    { key: 'silai_single', labelUr: 'سنگل سلائی' },
    { key: 'silai_double_dd', labelUr: 'ڈبل سلائی D.D' },
    { key: 'silai_triple', labelUr: 'ٹرپل سلائی' },
    { key: 'silai_double', labelUr: 'ڈبل سلائی' },
    { key: 'silai_sada', labelUr: 'سادہ سلائی' },
    { key: 'silai_sada_double', labelUr: 'سادہ ڈبل سلائی' },
    { key: 'silai_chamak_tar', labelUr: 'چمک تار سنگل سلائی' },
    { key: 'silai_chamak_tar_double', labelUr: 'چمک تار ڈبل سلائی' },
    { key: 'silai_tak_pa_tak', labelUr: 'ٹک پہ ٹک سلائی' },
    { key: 'silai_tak_pa_tak_samne', labelUr: 'ٹک پہ ٹک سامنے' },
    { key: 'silai_choka', labelUr: 'چوکا سلائی' },
];

export const BAN_OPTIONS = [
    { key: 'ban_half_gol', labelUr: 'ہاف گول' },
    { key: 'ban_half_seedha', labelUr: 'ہاف سیدھا' },
    { key: 'ban_full_gol', labelUr: 'فل گول' },
    { key: 'ban_full_seedha', labelUr: 'فل سیدھا' },
];

export const WC_COLLAR_OPTIONS = [
    { key: 'wc_collar_ban', asset: 'WaistCoat/Ban_Collar.svg', raw: wcBanCollarRaw, labelUr: 'بین کالر' },
    { key: 'wc_collar_gol', asset: 'WaistCoat/Gol_Collar.svg', raw: wcGolCollarRaw, labelUr: 'گول کالر' },
    { key: 'wc_collar_v', asset: 'WaistCoat/V_Shaped.svg', raw: wcVShapedRaw, labelUr: 'وی شیپ' },
];

export const WC_GERA_OPTIONS = [
    { key: 'wc_gera_gol', labelUr: 'گول گیرا' },
    { key: 'wc_gera_seedha', labelUr: 'سیدھا گیرا' },
];

export const COAT_BUTTON_OPTIONS = [
    { key: 'coat_1_button', labelUr: '1 بٹن' },
    { key: 'coat_2_button', labelUr: '2 بٹن' },
];

export const COAT_CHAAK_OPTIONS = [
    { key: 'coat_band_chaak', labelUr: 'بند چاک' },
    { key: 'coat_2_chaak', labelUr: '2 چاک' },
];

export const CUFF_OPTIONS = [
    { key: 'cuff_fold', labelUr: 'فولڈ کف', label: 'Fold Cuff' },
    { key: 'cuff_seedha', labelUr: 'سیدھا کف', label: 'Seedha Cuff' },
    { key: 'cuff_gol', labelUr: 'گول کف', label: 'Gol Cuff' },
    { key: 'cuff_cut', labelUr: 'کٹ کف', label: 'Cut Cuff' },
];

export const BUTTON_DESIGN_OPTIONS = [
    { key: 'btn_tak', labelUr: 'ٹک بٹن', label: 'Tak Button' },
    { key: 'btn_steel', labelUr: 'سٹیل بٹن', label: 'Steel Button' },
    { key: 'btn_ring', labelUr: 'رنگ بٹن', label: 'Ring Button' },
    { key: 'btn_vip', labelUr: 'وی آئی پی بٹن', label: 'VIP Button' },
];

// Combine everything into a flat array of LayoutElements for the dynamic editor
export const DEFAULT_LAYOUT: LayoutElement[] = [
    // --- Header Block ---
    { id: 'header_title', type: 'textBlock', x: 0, y: 2, width: 100, content: 'نظام ٹیلرز', fontSize: 36, color: '#0f172a', isFixed: true },
    { id: 'header_subtitle', type: 'textBlock', x: 0, y: 8, width: 100, content: 'Contact No:', fontSize: 12, color: '#64748b', isFixed: true },

    // Divider Line
    { id: 'header_divider', type: 'textBlock', x: 2, y: 12, width: 96, height: 0.2, content: '', color: '#cbd5e1', isFixed: true },

    // Header labels row
    { id: 'header_label_sno', type: 'textBlock', x: 2, y: 14, width: 15, content: 'S.No.', fontSize: 12, color: '#475569', isFixed: true },
    { id: 'header_label_name', type: 'textBlock', x: 18, y: 14, width: 30, content: 'Name', fontSize: 12, color: '#475569', isFixed: true },
    { id: 'header_label_suitQty', type: 'textBlock', x: 50, y: 14, width: 20, content: 'Suit Qty', fontSize: 12, color: '#475569', isFixed: true },
    { id: 'header_label_karigar', type: 'textBlock', x: 72, y: 14, width: 20, content: 'Karigar', fontSize: 12, color: '#475569', isFixed: true },

    // Header values row
    { id: 'header_val_sno', type: 'input', x: 2, y: 15, width: 15, height: 4.5, content: { label: '', field: 'sNo', hideLabel: true }, isFixed: true },
    { id: 'header_val_name', type: 'input', x: 18, y: 15, width: 30, height: 4.5, content: { label: '', field: 'customerName', hideLabel: true }, isFixed: true },
    { id: 'header_val_suitQty', type: 'input', x: 50, y: 15, width: 20, height: 4.5, content: { label: '', field: 'suitQty', hideLabel: true }, isFixed: true },
    { id: 'header_val_karigar', type: 'input', x: 72, y: 15, width: 20, height: 4.5, content: { label: '', field: 'karigar', hideLabel: true }, isFixed: true },

    // --- Left Numbered Column (11 inputs) ---
    { id: 'left_row_0', type: 'input', x: 2, y: 19.5, width: 15, height: 4.5, content: { label: '1', field: 'left1', hideLabel: true }, isFixed: true },
    { id: 'left_row_1', type: 'input', x: 2, y: 24, width: 15, height: 4.5, content: { label: '2', field: 'left2', hideLabel: true }, isFixed: true },
    { id: 'left_row_2', type: 'input', x: 2, y: 28.5, width: 15, height: 4.5, content: { label: '3', field: 'left3', hideLabel: true }, isFixed: true },
    { id: 'left_row_3', type: 'input', x: 2, y: 33, width: 15, height: 4.5, content: { label: '4', field: 'left4', hideLabel: true }, isFixed: true },
    { id: 'left_row_4', type: 'input', x: 2, y: 37.5, width: 15, height: 4.5, content: { label: '5', field: 'left5', hideLabel: true }, isFixed: true },
    { id: 'left_row_5', type: 'input', x: 2, y: 42, width: 15, height: 4.5, content: { label: '6', field: 'left6', hideLabel: true }, isFixed: true },
    { id: 'left_row_6', type: 'input', x: 2, y: 46.5, width: 15, height: 4.5, content: { label: '7', field: 'left7', hideLabel: true }, isFixed: true },
    { id: 'left_row_7', type: 'input', x: 2, y: 51, width: 15, height: 4.5, content: { label: '8', field: 'left8', hideLabel: true }, isFixed: true },
    { id: 'left_row_8', type: 'input', x: 2, y: 55.5, width: 15, height: 4.5, content: { label: '9', field: 'left9', hideLabel: true }, isFixed: true },
    { id: 'left_row_9', type: 'input', x: 2, y: 60, width: 15, height: 4.5, content: { label: '10', field: 'left10', hideLabel: true }, isFixed: true },
    { id: 'left_row_10', type: 'input', x: 2, y: 64.5, width: 15, height: 4.5, content: { label: '11', field: 'left11', hideLabel: true }, isFixed: true },

    // --- Bottom Left Urdu Note ---
    { id: 'bottom_left_note', type: 'textBlock', x: 2, y: 72, width: 30, height: 24, content: '', fontSize: 12, color: '#475569', isFixed: true, direction: 'rtl' },

    // --- SVG Shapes (exact coordinates from user's designed layout) ---
    {
        id: 'svg_shape14', type: 'svg', x: 24.2, y: 23.67, width: 52.8, height: 9,
        content: {
            asset: 'Asset 14.svg', raw: asset14Raw, inputs: [
                { id: 'shape14_1', relX: 0, relY: 0, width: 25, placeX: 'center', placeY: 'top' },
            ]
        }
    },
    {
        id: 'svg_shape13', type: 'svg', x: 22.2, y: 26.64, width: 55, height: 5.71,
        content: {
            asset: 'Asset 13.svg', raw: asset13Raw, inputs: [
                { id: 'shape13_1', relX: 0, relY: 16, width: 25, placeX: 'center', placeY: 'manual' },
            ]
        }
    },
    {
        id: 'svg_shape10', type: 'svg', x: 28.2, y: 42.85, width: 29.8, height: 12.71,
        content: {
            asset: 'Asset 10.svg', raw: asset10Raw, inputs: [
                { id: 'shape10_1', relX: 10, relY: 18, width: 20, placeX: 'center' },
                { id: 'svg_shape10_2', relX: 77, relY: 57 },
            ]
        }
    },
    {
        id: 'svg_shape12', type: 'svg', x: 80.9, y: 51.27, width: 5.2, height: 14.29,
        content: {
            asset: 'Asset 12.svg', raw: asset12Raw, inputs: [
                { id: 'shape12_1', relX: 150, relY: -11, width: 200, placeY: 'top', placeX: 'manual' },
                { id: 'svg_shape12_2', relX: 150, relY: 50 },
                { id: 'svg_shape12_3', relX: 150, relY: 87 },
            ]
        }
    },
    {
        id: 'svg_shape9', type: 'svg', x: 69.45, y: 51.27, width: 6.2, height: 14.43,
        content: {
            asset: 'Asset 9.svg', raw: asset9Raw, inputs: [
                { id: 'svg_shape9_1', relX: -27, relY: 9 },
                { id: 'svg_shape9_2', relX: -27, relY: 49 },
                { id: 'svg_shape9_3', relX: -26, relY: 89 },
            ]
        }
    },
    {
        id: 'svg_shape1', type: 'svg', x: 21.9, y: 58.41, width: 25, height: 9.14,
        content: {
            asset: 'Asset 1.svg', raw: asset1Raw, inputs: [
                { id: 'shape1_1', relX: 0, relY: 0, width: 40, placeX: 'center', placeY: 'center' },
            ]
        }
    },
    {
        id: 'svg_shape8', type: 'svg', x: 33.65, y: 71.82, width: 18.8, height: 13.14,
        content: {
            asset: 'Asset 8.svg', raw: asset8Raw, inputs: [
                { id: 'shape8_1', relX: 0, relY: 0, width: 80, placeY: 'center', placeX: 'center' },
            ]
        }
    },
    {
        id: 'svg_shape7', type: 'svg', x: 53.3, y: 71.82, width: 23.6, height: 13.29,
        content: {
            asset: 'Asset 7.svg', raw: asset7Raw, inputs: [
                { id: 'shape7_1', relX: 33, relY: 16, width: 50, placeX: 'manual', placeY: 'manual' },
                { id: 'svg_shape7_2', relX: 70, relY: 16 },
                { id: 'svg_shape7_3', relX: 50, relY: -11, placeX: 'center', placeY: 'manual' },
            ]
        }
    },

    // Asset 6
    {
        id: 'svg_shape6', type: 'svg', x: 78.2, y: 67.71, width: 17.4, height: 16.57,
        content: {
            asset: 'Asset 6.svg', raw: asset6Raw, inputs: [
                { id: 'shape6_1', relX: 0, relY: 0, width: 100, placeX: 'center', placeY: 'center' },
                { id: 'svg_shape6_2', relX: 78, relY: 103 }
            ]
        }
    },

    // --- Daman Options ---
    { id: 'damanGroup', type: 'damanGroup', x: 6.6, y: 84.57, width: 18.8, height: 7.86, content: { options: DAMAN_OPTIONS } },

    // --- Shalwar Kameez Specific Toggles (Right Side) ---
    { id: 'sk_collar_toggle', type: 'skCollarToggleGroup', x: 67.6, y: 20.86, width: 29.8, height: 5.14, content: { field: 'sk_collar_type' } },
    { id: 'sk_patti_kaaj', type: 'skPattiKaajGroup', x: 18.2, y: 46.86, width: 29.8, height: 5, content: { field: 'sk_patti_kaaj' } },

    // --- Silai Options ---
    { id: 'silaiGroup', type: 'silaiGroup', x: 4, y: 70.86, width: 25, height: 4, content: { options: SILAI_OPTIONS } },

    // --- Ban (Collar) Options ---
    { id: 'banGroup', type: 'banGroup', x: 27.6, y: 31.71, width: 25, height: 5.71, content: { options: BAN_OPTIONS } },

    // --- Cuff Options ---
    { id: 'cuffGroup', type: 'cuffGroup', x: 30.4, y: 37.43, width: 25, height: 5.71, content: { options: CUFF_OPTIONS } },

    // --- Button Design Options ---
    { id: 'buttonDesignGroup', type: 'buttonDesignGroup', x: 57, y: 37.43, width: 40, height: 5.71, content: { options: BUTTON_DESIGN_OPTIONS } },

    // Additional Notes Area
    { id: 'sk_notes_area', type: 'textArea', x: 29.8, y: 87.86, width: 52, height: 10, content: { label: 'Other Details / Notes', field: 'other_details' } }
];
