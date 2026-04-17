const fs = require('fs'); const txt = fs.readFileSync('src/components/forms/CustomerMeasurementForm.tsx', 'utf8'); console.log(txt.match(/[^\x00-\x7F]+/g)?.slice(0, 50));
