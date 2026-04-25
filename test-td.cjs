const fs = require('fs');
let tex = fs.readFileSync('src/components/settings/TemplateDesigner.tsx', 'utf8');
let match = tex.match(/Ø³Ø§Ø¯Û Ù¾Ù¹ÛŒ/);
if (match) {
   console.log('Mathced literal! indices:', match.index);
   for (let i = 0; i < match[0].length; i++) {
      console.log(match[0][i], match[0].charCodeAt(i).toString(16));
   }
} else {
   console.log('Not matched. Let me search around skPattiTypeGroup');
   let lines = tex.split('\n');
   for(let i=0; i<lines.length; i++) {
        if(lines[i].includes('skPattiTypeGroup')) {
            console.log(lines[i+4].trim());
            for(let j=0; j<lines[i+4].trim().length; j++) {
                console.log(lines[i+4].trim()[j], lines[i+4].trim().charCodeAt(j).toString(16));
            }
        }
   }
}
