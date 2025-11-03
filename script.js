
// Hydrate UI
(function(){
  const C = window.DHOFARCARE_CONFIG || {};
  document.querySelectorAll('.phone').forEach(n=>n.textContent=C.WHATSAPP||C.PHONE_E164||'');
  document.querySelectorAll('.email').forEach(n=>n.textContent=C.EMAIL||'');
  document.querySelectorAll('.area').forEach(n=>n.textContent=C.SERVICE_AREA||'');
  document.querySelectorAll('.hours').forEach(n=>n.textContent=C.HOURS||'');
  document.querySelectorAll('.address').forEach(n=>n.textContent=C.ADDRESS||'');
  document.querySelectorAll('.phoneLink').forEach(a=>{ a.href=`https://wa.me/${(C.WHATSAPP||'').replace(/\D/g,'')}`; });
  document.querySelectorAll('.emailLink').forEach(a=>{ a.href=`mailto:${C.EMAIL}`; });
  document.getElementById('year').textContent = new Date().getFullYear();
  document.documentElement.style.setProperty('--primary', C.PRIMARY_COLOR||'#0A66C2');
  document.documentElement.style.setProperty('--accent', C.ACCENT_COLOR||'#4DA3FF');
})();

// DateTime min & default
const dt = document.getElementById('datetime');
if (dt){
  const now = new Date();
  const roundTo = 15;
  const ms = 1000*60*roundTo;
  const rounded = new Date(Math.ceil(now.getTime()/ms)*ms + 60*60*1000); // +1h
  const pad = n => String(n).padStart(2,'0');
  const toLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  dt.min = toLocal(new Date(Math.ceil(now.getTime()/ms)*ms));
  dt.value = toLocal(rounded);
}

// Booking logic
const bookingForm = document.getElementById('bookingForm');
const paymentPanel = document.getElementById('paymentPanel');
const paymentForm = document.getElementById('paymentForm');
const successPanel = document.getElementById('successPanel');
const backToBooking = document.getElementById('backToBooking');
const newBooking = document.getElementById('newBooking');

function luhnValid(num){
  const s = num.replace(/\D/g,'');
  let sum = 0, dbl=false;
  for(let i=s.length-1;i>=0;i--){
    let d = parseInt(s[i],10);
    if(dbl){ d*=2; if(d>9) d-=9; }
    sum+=d; dbl=!dbl;
  }
  return (sum % 10)===0 && s.length>=13;
}

bookingForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(bookingForm).entries());
  localStorage.setItem('dhofarcare_booking', JSON.stringify(data));
  bookingForm.classList.add('hidden');
  paymentPanel.classList.remove('hidden');
  window.scrollTo({top: paymentPanel.offsetTop - 60, behavior: 'smooth'});
});

backToBooking?.addEventListener('click', ()=>{
  paymentPanel.classList.add('hidden');
  bookingForm.classList.remove('hidden');
});

paymentForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const card = paymentForm.cardnumber.value.trim();
  const exp = paymentForm.exp.value.trim();
  const cvc = paymentForm.cvc.value.trim();
  if(!luhnValid(card)){ alert('الرجاء إدخال رقم بطاقة تجريبي صحيح (مثال 4242 4242 4242 4242).'); return; }
  if(!/^\d{2}\/(\d{2})$/.test(exp)){ alert('صيغة الانتهاء MM/YY.'); return; }
  if(!/^\d{3,4}$/.test(cvc)){ alert('أدخل CVC من 3–4 أرقام.'); return; }

  const booking = JSON.parse(localStorage.getItem('dhofarcare_booking')||'{}');
  localStorage.setItem('dhofarcare_lastSuccess', JSON.stringify({when: Date.now(), booking}));
  paymentPanel.classList.add('hidden');
  successPanel.classList.remove('hidden');
  window.scrollTo({top: successPanel.offsetTop - 60, behavior: 'smooth'});
  bookingForm.reset();
  paymentForm.reset();
});

paymentForm?.cardnumber?.addEventListener('input', (e)=>{
  let v = e.target.value.replace(/\D/g,'').slice(0,16);
  e.target.value = v.replace(/(\d{4})(?=\d)/g, '$1 ');
});

// === AI Assistant (rule-based) ===
const aiLog = document.getElementById('aiLog');
const aiInput = document.getElementById('aiInput');
const aiSend = document.getElementById('aiSend');
document.querySelectorAll('.qbtn').forEach(b=>b.addEventListener('click',()=>{
  aiInput.value = b.dataset.q; aiSend.click();
}));

function addMsg(text, who){
  const div = document.createElement('div');
  div.className = 'msg ' + (who||'ai');
  div.innerHTML = text;
  aiLog.appendChild(div);
  aiLog.scrollTop = aiLog.scrollHeight;
}

function reply(text){
  const C = window.DHOFARCARE_CONFIG || {};
  const phone = C.WHATSAPP || C.PHONE_E164 || '';
  const email = C.EMAIL || '';
  const price = C.PRICE_HINT || 'الأسعار تتفاوت حسب نوع الخدمة.';

  const t = text.trim();
  const lower = t.toLowerCase();

  // Greetings / welcome
  if(/مرحبا|السلام|hi|hello|هلا|اهلا/.test(t)){
    return `مرحبًا بكم في الردّ الآلي لِـ <b>DhofarCare</b>! نعم، كيف نقدر نخدمك؟ اختر الخدمة المطلوبة وسأساعدك بالحجز.`;
  }
  // Services
  if(/خدمات|service|موجود|available/.test(lower)){
    return `خدماتنا: <b>تنظيف منازل، صيانة، تجميل منزلي، وخدمات خاصة</b>. يمكنك البدء بالحجز من قسم <a href="#book">احجز</a>.`;
  }
  // Price
  if(/سعر|كم|price|تكلف/.test(lower)){
    return `الأسعار ${price}. للحالات الخاصة سنحدّد السعر بعد مراجعة التفاصيل.`;
  }
  // Contact
  if(/تواصل|اتصال|whatsapp|email|رقم/.test(lower)){
    return `هذا رقم الواتساب: <a class="phoneLink"><span class="phone"></span></a> — وهذا البريد: <a class="emailLink"><span class="email"></span></a>. شكرًا لتواصلك!`;
  }
  // Thanks
  if(/شكرا|thx|thanks|thank/.test(lower)){
    return `شكرًا لكم! يسعدنا خدمتك في أي وقت.`;
  }
  // Fallback
  return `سؤال جميل! أستطيع مساعدتك في اختيار الخدمة والحجز. إن أردت معرفة الأسعار اكتب "كم السعر؟" ولمعلومات التواصل اكتب "التواصل".`;
}

aiSend?.addEventListener('click', ()=>{
  const v = (aiInput.value||'').trim();
  if(!v) return;
  addMsg(v, 'user');
  aiInput.value = '';
  // typing simulation
  const typing = document.createElement('div');
  typing.className = 'msg ai'; typing.textContent = 'يكتب…';
  aiLog.appendChild(typing); aiLog.scrollTop = aiLog.scrollHeight;
  setTimeout(()=>{
    typing.remove();
    addMsg(reply(v),'ai');
  }, 500);
});
