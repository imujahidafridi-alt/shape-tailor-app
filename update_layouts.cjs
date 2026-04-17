const fs = require('fs');

try {
    const jsonStr = fs.readFileSync('tailorpro_all_templates_1776021098264.json', 'utf-8');
    const data = JSON.parse(jsonStr);

    let tsFile = fs.readFileSync('src/utils/slipLayout.ts', 'utf-8');

    const map = {
        "Asset 1.svg": "asset1Raw",
        "Asset 2.svg": "asset2Raw",
        "Asset 3.svg": "asset3Raw",
        "Asset 7.svg": "asset7Raw",
        "Asset 8.svg": "asset8Raw",
        "Asset 9.svg": "asset9Raw",
        "Asset 10.svg": "asset10Raw",
        "Asset 12.svg": "asset12Raw",
        "Asset 13.svg": "asset13Raw",
        "Asset 14.svg": "asset14Raw",
        "Asset 6.svg": "asset6Raw",
        "WaistCoat/Ban_Collar.svg": "wcBanCollarRaw",
        "WaistCoat/Gol_Collar.svg": "wcGolCollarRaw",
        "WaistCoat/V_Shaped.svg": "wcVShapedRaw"
    };

    // Before we stringify, let's explicitly delete data.layouts.shalwar_kameez.raw if any
    function cleanRaw(obj) {
        if (Array.isArray(obj)) {
            obj.forEach(cleanRaw);
        } else if (obj !== null && typeof obj === 'object') {
            if ('raw' in obj) {
                delete obj.raw;
            }
            for (let key in obj) {
                cleanRaw(obj[key]);
            }
        }
    }

    cleanRaw(data.layouts);

    function injectRaw(objStr) {
        let result = objStr;
        // Find every "asset": "name" and if mapped, add "raw": mapped_val
        for (const [key, variable] of Object.entries(map)) {
            const pattern = new RegExp(`"asset"\\s*:\\s*"${key}"`, "g");
            result = result.replace(pattern, `"asset": "${key}", "raw": ${variable}`);
        }
        return result;
    }

    const shalwar = injectRaw(JSON.stringify(data.layouts.shalwar_kameez, null, 4));
    const waistcoat = injectRaw(JSON.stringify(data.layouts.waistcoat, null, 4));
    const coat = injectRaw(JSON.stringify(data.layouts.coat, null, 4));

    // Let's replace manually using split/indexOf
    // 1. DEFAULT_WAISTCOAT_LAYOUT
    let wStart = tsFile.indexOf('export const DEFAULT_WAISTCOAT_LAYOUT: LayoutElement[] = [');
    let wEnd = tsFile.indexOf('export const DEFAULT_COAT_LAYOUT', wStart);
    if (wStart > -1 && wEnd > -1) {
        tsFile = tsFile.substring(0, wStart) + `export const DEFAULT_WAISTCOAT_LAYOUT: LayoutElement[] = ${waistcoat};\n\n` + tsFile.substring(wEnd);
    }

    // 2. DEFAULT_COAT_LAYOUT
    let cStart = tsFile.indexOf('export const DEFAULT_COAT_LAYOUT: LayoutElement[] = [');
    let cEnd = tsFile.indexOf('export const DAMAN_OPTIONS', cStart);
    if (cStart > -1 && cEnd > -1) {
        tsFile = tsFile.substring(0, cStart) + `export const DEFAULT_COAT_LAYOUT: LayoutElement[] = ${coat};\n\n` + tsFile.substring(cEnd);
    }

    // 3. DEFAULT_LAYOUT (Shalwar Kameez)
    let sStart = tsFile.indexOf('export const DEFAULT_LAYOUT: LayoutElement[] = [');
    if (sStart > -1) {
        // Ends at EOF
        tsFile = tsFile.substring(0, sStart) + `export const DEFAULT_LAYOUT: LayoutElement[] = ${shalwar};\n`;
    }

    fs.writeFileSync('src/utils/slipLayout.ts', tsFile);
    console.log('Update Complete!');
} catch (e) {
    console.error(e);
}