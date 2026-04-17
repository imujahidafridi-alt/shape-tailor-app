const fs = require('fs');
let t = fs.readFileSync('src/components/forms/CustomerMeasurementForm.tsx', 'utf8');

t = t.replace(/Ù†Ø§Ù¾ ØµØ§Ù\x81 Ú©Ø± Ø¯ÛŒÛ’\s*Ú¯Ø¦Û’/g, 'ناپ صاف کر دیئے گئے');
t = t.replace(/Ù…ØÙ\x81ÙˆØ¸ Û\x81Ùˆ Ø±Û\x81Ø§ Û\x81Û’/g, 'محفوظ ہو رہا ہے');
t = t.replace(/Ù…ØÙ\x81ÙˆØ¸/g, 'محفوظ');
t = t.replace(/Ø®Ø±Ø§Ø¨ÛŒ/g, 'خرابی');
t = t.replace(/Ø³Ø§Ø¯Û\x81 Ú©Ø§Ù„Ø±/g, 'سادہ کالر');
t = t.replace(/Ù¾Ù¹ÛŒ Ú©Ø§Ø¬ Û\x81Ùˆ/g, 'پٹی کاج ہو');
t = t.replace(/Ø±Ø³ÛŒØ¯ Ú¯Ù… Û\x81Ùˆ Ø¬Ø§Ù†Û’\s*Ù¾Ø± Ø§Ú¯Ø± Ø¹Ø¯Ø¯ Ù…ÛŒÚº Ú©Ø³ÛŒ Ù‚Ø³Ù… Ú©ÛŒ\s*Ø¨Ú¾ÛŒ ØºÙ„Ø·ÛŒ Û\x81ÙˆØ¦ÛŒ ØªÙˆ Ø§Ø³ Ú©Ø§ Ø°Ù…\s*Û\x81\s*Ø¯Ø§Ø± Ú©Ø§Ø±ÛŒÚ¯Ø± Û\x81ÙˆÚ¯Ø§Û”/g, 'رسید گم ہو جانے پر اگر عدد میں کسی قسم کی بھی غلطی ہوئی تو اس کا ذمہ دار کاریگر ہوگا۔');
t = t.replace(/ری سیٹ Ú©ÛŒ ØªØµØ¯ÛŒÙ‚/g, 'ری سیٹ کی تصدیق');
t = t.replace(/Ú©ÛŒØ§ Ø¢Ù¾ ÙˆØ§Ù‚Ø¹ÛŒ ØªÙ…Ø§Ù… Ù†Ø§Ù¾ ØµØ§Ù\x81 Ú©Ø±Ù†Ø§ Ú†Ø§Û\x81ØªÛ’ Û\x81ÛŒÚºØŸ/g, 'کیا آپ واقعی تمام ناپ صاف کرنا چاہتے ہیں؟');
t = t.replace(/Ù†Ø§Ù¾/g, 'ناپ');

fs.writeFileSync('src/components/forms/CustomerMeasurementForm.tsx', t, 'utf8');
console.log('Fixed CustomerMeasurementForm.tsx');
