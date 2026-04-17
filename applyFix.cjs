const fs = require('fs');

function fix(text) {
    let buf = Buffer.from(text, 'binary');
    return buf.toString('utf8');
}

const files = [
    'src/components/forms/CustomerMeasurementForm.tsx',
    'src/utils/printHelpers.ts'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let lines = content.split('\n');
    let fixed = lines.map(line => {
        // If it looks like mojibake, try decoding
        if (line.includes('Ú') || line.includes('Ø') || line.includes('Ù') || line.includes('Û')) {
            let attempt = fix(line);
            // check if it now has valid arabic/urdu ranges
            if (/[\u0600-\u06FF]/.test(attempt)) {
                return attempt;
            }
        }
        return line;
    });
    fs.writeFileSync(file, fixed.join('\n'), 'utf8');
});
console.log('Done');
