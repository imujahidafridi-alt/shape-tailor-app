const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace mojibake manually
  content = content.replace(/labelUr:\s*\"[^\"]*\"/g, match => {
    // If it's already correct, leave it. But we're mostly replacing bad ones.
    if (match.includes('sada_patti') || match.includes('Ø³Ø§Ø¯Û Ù¾Ù¹ÛŒ') || match.includes('Ã˜Â³Ã˜Â§Ã˜Â¯Ã› Ù¾Ù¹ÛŒ') || match.includes('سادہ پٹی')) return 'labelUr: \"سادہ پٹی\"';
    if (match.includes('ghum_patti') || match.includes('Ú¯Ù… Ù¾Ù¹ÛŒ') || match.includes('ÃšÂ¯Ã™â€¦ Ù¾Ù¹ÛŒ') || match.includes('گم پٹی')) return 'labelUr: \"گم پٹی\"';
    if (match.includes('default') || match.includes('Ã˜Â¨Ã˜ÂºÃ›Å’Ã˜Â± Ã˜Â¨ÃšÂ©Ã˜Â±Ã™â€¦') || match.includes('Ø¨ØºÛŒØ± Ø¨Ú©Ø±Ù…') || match.includes('بغیر بکرم')) return 'labelUr: \"بغیر بکرم\"';
    if (match.includes('sada_bukram') || match.includes('Ã˜Â³Ã˜Â§Ã˜Â¯Ã› Ã˜Â¨ÃšÂ©Ã˜Â±Ã™â€¦') || match.includes('Ø³Ø§Ø¯Û Ø¨Ú©Ø±Ù…') || match.includes('سادہ بکرم')) return 'labelUr: \"سادہ بکرم\"';
    if (match.includes('kani_asteen') || match.includes('ÃšÂ©Ã™â€Ã›Å’ Ã˜Â¢Ã˜Â³Ã˜ÂªÃ›Å’Ã™â€') || match.includes('Ú©Ù†ÛŒ Ø¢Ø³ØªÛŒÙ†') || match.includes('کنی آستین')) return 'labelUr: \"کنی آستین\"';
    if (match.includes('baghair_bukram_fold') || match.includes('Ã˜Â¨Ã˜ÂºÃ›Å’Ã˜Â± Ã˜Â¨ÃšÂ©Ã˜Â±Ã™â€¦ Ã™Ã™Ë†Ã™â€žÃšË†') || match.includes('Ø¨ØºÛŒØ± Ø¨Ú©Ø±Ù… Ù ÙˆÙ„Úˆ') || match.includes('بغیر بکرم فولڈ')) return 'labelUr: \"بغیر بکرم فولڈ\"';
    
    return match; // fallback
  });
  
  // Also fix the inline conditionals if they are corrupted
  // e.g. fields["sk_patti_type"] === "ghum_patti" ? "Ú¯Ù… Ù¾Ù¹ÛŒ" : "Ø³Ø§Ø¯Û Ù¾Ù¹ÛŒ"
  content = content.replace(/\?\s*\"([^\"]*)\"\s*:\s*\"([^\"]*)\"/g, (match, p1, p2) => {
    if (p2.includes('Ø³Ø§Ø¯Û Ù¾Ù¹ÛŒ') || p2.includes('Ã˜Â³Ã˜Â§Ã˜Â¯Ã› Ù¾Ù¹ÛŒ')) {
      return '? \"گم پٹی\" : \"سادہ پٹی\"'; 
    }
    return match;
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed:', file);
  } else {
    console.log('No changes needed or regex failed for:', file);
  }
}

fixFile('src/components/forms/CustomerMeasurementForm.tsx');
fixFile('src/components/settings/TemplateDesigner.tsx');
