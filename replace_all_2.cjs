const fs = require('fs');
let txt = fs.readFileSync('src/components/forms/CustomerMeasurementForm.tsx', 'utf8');

txt = txt.replace(/Ù…ØÙ.ÙˆØ¸ Û.Ùˆ Ø±Û.Ø§ Û.*?/g, 'محفوظ ہو رہا ہے...');
txt = txt.replace(/Ù…ØÙ.ÙˆØ¸/g, 'محفوظ');
txt = txt.replace(/Ø®Ø±Ø§Ø¨Û./g, 'خرابی');
txt = txt.replace(/Ø³Ø§Ø¯Û. Ú©Ø§Ù„Ø±/g, 'سادہ کالر');
txt = txt.replace(/Ù¾Ù.Û. Ú©Ø§Ø¬ Û.Ùˆ/g, 'پٹی کاج ہو');
txt = txt.replace(/ری سیٹ Ú©Û. ØªØµØ¯Û.Ù./g, 'ری سیٹ کی تصدیق');
txt = txt.replace(/Ú©Û.Ø§ Ø¢Ù¾ ÙˆØ§Ù‚Ø¹Û. ØªÙ…Ø§Ù… Ù†Ø§Ù¾ ØµØ§Ù. Ú©Ø±Ù†Ø§ Ú†Ø§Û.ØªÛ. Û.Û.ÚºØŸ/g, 'کیا آپ واقعی تمام ناپ صاف کرنا چاہتے ہیں؟');

fs.writeFileSync('src/components/forms/CustomerMeasurementForm.tsx', txt, 'utf8');
console.log('Fixed CustomerMeasurementForm.tsx entirely');
