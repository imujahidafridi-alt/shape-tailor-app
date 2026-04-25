const fs = require('fs');

function repairFile(file) {
  let text = fs.readFileSync(file, 'utf8');
  let original = text;
  
  // Try converting it by finding all sequences of bytes >= 127
  let res = "";
  for (let i = 0; i < text.length; i++) {
      let code = text.charCodeAt(i);
      if (code >= 0x80 && code <= 0xFF) {
          let buf = [];
          while(i < text.length && text.charCodeAt(i) >= 0x80 && text.charCodeAt(i) <= 0xFF) {
              buf.push(text.charCodeAt(i));
              i++;
          }
          i--;
          try {
             let converted = Buffer.from(buf).toString('utf8');
             // If the utf8 conversion looks like it worked and didn't result in replacement chars
             if (!converted.includes('\ufffd')) {
                res += converted;
             } else {
                res += String.fromCharCode(...buf);
             }
          } catch(e) {
             res += String.fromCharCode(...buf);
          }
      } else {
          res += text[i];
      }
  }

  // Double repair for double-encoded ones
  let res2 = "";
  for (let i = 0; i < res.length; i++) {
      let code = res.charCodeAt(i);
      if (code >= 0x80 && code <= 0xFF) {
          let buf = [];
          while(i < res.length && res.charCodeAt(i) >= 0x80 && res.charCodeAt(i) <= 0xFF) {
              buf.push(res.charCodeAt(i));
              i++;
          }
          i--;
          try {
             let converted = Buffer.from(buf).toString('utf8');
             if (!converted.includes('\ufffd')) {
                res2 += converted;
             } else {
                res2 += String.fromCharCode(...buf);
             }
          } catch(e) {
             res2 += String.fromCharCode(...buf);
          }
      } else {
          res2 += res[i];
      }
  }

  if (res2 !== original) {
    fs.writeFileSync(file, res2);
    console.log('Successfully repaired:', file);
  } else {
    console.log('No repair needed:', file);
  }
}

repairFile('src/components/settings/TemplateDesigner.tsx');
// Also double check form file in case fix-urdu2 didn't catch everything
repairFile('src/components/forms/CustomerMeasurementForm.tsx');
