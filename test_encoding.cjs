const fs = require('fs');

let text = fs.readFileSync('src/components/forms/CustomerMeasurementForm.tsx', 'utf8');

// Find a known string that has mojibake
let lines = text.split('\n');
for (let line of lines) {
  if (line.includes('labelUr:')) {
    let str = line.trim();
    console.log('Found:', str);
    for(let i=0; i<Math.min(30, str.length); i++) {
        console.log(str[i], str.charCodeAt(i).toString(16));
    }
    
    // Try converting it
    let res = "";
    for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i);
        if (code >= 0x80 && code <= 0xFF) {
            let buf = [];
            while(i < str.length && str.charCodeAt(i) >= 0x80 && str.charCodeAt(i) <= 0xFF) {
                buf.push(str.charCodeAt(i));
                i++;
            }
            i--;
            res += Buffer.from(buf).toString('utf8');
        } else {
            res += str[i];
        }
    }
    console.log("Converted:", res);
    break;
  }
}
