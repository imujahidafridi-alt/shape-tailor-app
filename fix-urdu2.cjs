const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace mojibake literals globally
  content = content.replace(/Ø³Ø§Ø¯Û Ù¾Ù¹ÛŒ|Ã˜Â³Ã˜Â§Ã˜Â¯Ã› Ù¾Ù¹ÛŒ/g, "سادہ پٹی");
  content = content.replace(/Ú¯Ù… Ù¾Ù¹ÛŒ|ÃšÂ¯Ã™â€¦ Ù¾Ù¹ÛŒ/g, "گم پٹی");
  content = content.replace(/Ø¨ØºÛŒØ± Ø¨Ú©Ø±Ù…|Ã˜Â¨Ã˜ÂºÃ›Å’Ã˜Â± Ã˜Â¨ÃšÂ©Ã˜Â±Ã™â€¦/g, "بغیر بکرم");
  content = content.replace(/Ø³Ø§Ø¯Û Ø¨Ú©Ø±Ù…|Ã˜Â³Ã˜Â§Ã˜Â¯Ã› Ã˜Â¨ÃšÂ©Ã˜Â±Ã™â€¦/g, "سادہ بکرم");
  content = content.replace(/Ú©Ù†ÛŒ Ø¢Ø³ØªÛŒÙ†|ÃšÂ©Ã™â€Ã›Å’ Ã˜Â¢Ã˜Â³Ã˜ÂªÃ›Å’Ã™â€/g, "کنی آستین");
  content = content.replace(/Ø¨ØºÛŒØ± Ø¨Ú©Ø±Ù… Ù ÙˆÙ„Úˆ|Ã˜Â¨Ã˜ÂºÃ›Å’Ã˜Â± Ã˜Â¨ÃšÂ©Ã˜Â±Ã™â€¦ Ã™Ã™Ë†Ã™â€žÃšË†/g, "بغیر بکرم فولڈ");

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed literals globally:', file);
  } else {
    console.log('No changes needed:', file);
  }
}

fixFile('src/components/forms/CustomerMeasurementForm.tsx');
fixFile('src/components/settings/TemplateDesigner.tsx');
