const fs = require('fs');
const iconv = require('iconv-lite');

const files = ['src/components/forms/CustomerMeasurementForm.tsx', 'src/utils/printHelpers.ts', 'src/utils/slipLayout.ts'];
for (const p of files) {
  let content = fs.readFileSync(p); // buffer
  let strObj = content.toString('utf8'); // It read the corrupted UTF8 string
  
  // Create a buffer from each unicode character mapping back to its Windows-1252 byte value:
  let win1252Buf = Buffer.alloc(strObj.length);
  let failed = false;
  for (let i = 0; i < strObj.length; i++) {
     let ch = strObj[i];
     // Try to encode back to win1252 to get the original raw bytes
     let encoded = iconv.encode(ch, 'win1252');
     if (encoded.length === 1) {
         win1252Buf[i] = encoded[0];
     } else {
         // Some characters like generic ASCII are 1 byte
         win1252Buf[i] = ch.charCodeAt(0) & 0xFF;
     }
  }
  
  let fixedExt = win1252Buf.toString('utf8');
  if (fixedExt.includes('نظام') || fixedExt.includes('سیدھا') || fixedExt.includes('کالر') || fixedExt.indexOf('سلائی') !== -1) {
      console.log('Fixed:', p);
      fs.writeFileSync(p, fixedExt, 'utf8');
  } else {
      console.log('Failed:', p);
      console.log('Preview:', fixedExt.substring(0, 100));
  }
}
