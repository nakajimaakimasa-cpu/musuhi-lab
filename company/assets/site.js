/* 下層ページ共通のふるまい。
   トップ（v2.html）は同じ処理をインラインで持っているので、このファイルは読み込まない。
   ここに切り出したのは、断片ファイルに書き忘れるとスマホでナビが永久に開かなくなるため。 */
(function () {
  'use strict';

  /* ---------- ヘッダーのナビ（1023px以下はこれが無いと開かない） ---------- */
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');

  function setMenu(open) {
    if (!header || !toggle) return;
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  }

  if (header && toggle) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    Array.prototype.forEach.call(header.querySelectorAll('.site-nav a'), function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setMenu(false);
    });
  }

  /* ---------- 相談フォーム（トップと同じ mailto 方式） ---------- */
  var MAIL_TO = 'asamif15@gmail.com';
  var BRAND_TAG = '【ムスヒ】';
  var STATUS_TEXT = 'メールアプリが開きます。開かない場合は ' + MAIL_TO + ' へ直接ご連絡ください。';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var MESSAGES = {
    name: 'お名前を入力してください。',
    email: 'メールアドレスを入力してください。',
    emailFormat: 'メールアドレスの形式が正しくありません。'
  };
  var FIELD_LABELS = [
    ['company', '会社名・屋号'],
    ['name', 'お名前'],
    ['email', 'メールアドレス'],
    ['tel', '電話番号'],
    ['type', 'ご相談の種類'],
    ['message', 'ご相談内容']
  ];
  var REQUIRED_KEYS = ['name', 'email'];

  function fieldOf(form, key) { return form.elements.namedItem(key); }

  function readValues(form) {
    var values = {};
    FIELD_LABELS.forEach(function (pair) {
      var field = fieldOf(form, pair[0]);
      values[pair[0]] = field ? String(field.value).trim() : '';
    });
    return values;
  }

  function setFieldError(form, key, message) {
    var field = fieldOf(form, key);
    var note = form.querySelector('[data-error-for="' + key + '"]');
    if (!field || !note) return;
    var hasError = Boolean(message);
    field.setAttribute('aria-invalid', hasError ? 'true' : 'false');
    note.textContent = hasError ? message : '';
    note.hidden = !hasError;
  }

  function validate(values) {
    var errors = [];
    if (!values.name) errors.push(['name', MESSAGES.name]);
    if (!values.email) errors.push(['email', MESSAGES.email]);
    else if (!EMAIL_RE.test(values.email)) errors.push(['email', MESSAGES.emailFormat]);
    return errors;
  }

  function buildMailto(values) {
    var subject = BRAND_TAG + values.type + '：' + values.name;
    var lines = FIELD_LABELS.map(function (pair) {
      var value = values[pair[0]] || '（未記入）';
      return pair[0] === 'message' ? pair[1] + '：\n' + value : pair[1] + '：' + value;
    });
    var body = lines.concat(['', '— ムスヒ Webサイトのフォームより送信 —']).join('\n');
    return 'mailto:' + MAIL_TO + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  function showStatus(form, text) {
    var status = form.querySelector('[role="status"]');
    if (status) status.textContent = text;
  }

  function handleSubmit(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var values = readValues(form);
    var errors = validate(values);

    REQUIRED_KEYS.forEach(function (key) { setFieldError(form, key, ''); });
    showStatus(form, '');

    if (errors.length > 0) {
      errors.forEach(function (pair) { setFieldError(form, pair[0], pair[1]); });
      var first = fieldOf(form, errors[0][0]);
      if (first) first.focus();
      return;
    }

    window.location.href = buildMailto(values);
    showStatus(form, STATUS_TEXT);
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-lead-form]'), function (form) {
    form.addEventListener('submit', handleSubmit);
    REQUIRED_KEYS.forEach(function (key) {
      var field = fieldOf(form, key);
      if (field) field.addEventListener('input', function () { setFieldError(form, key, ''); });
    });
  });

  /* 同じページ内のフォームだけを埋める。別ページへ飛ぶリンクには付けないこと（値が渡らない） */
  var pageForm = document.getElementById('contact-form');
  if (pageForm) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-preselect-type]'), function (link) {
      link.addEventListener('click', function () {
        var select = fieldOf(pageForm, 'type');
        if (select) select.value = link.getAttribute('data-preselect-type');
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-plan]'), function (link) {
      link.addEventListener('click', function () {
        var textarea = fieldOf(pageForm, 'message');
        if (!textarea) return;
        if (textarea.value.trim() === '') {
          textarea.value = 'ご希望プラン：' + link.getAttribute('data-plan');
        }
      });
    });
  }

  /* ---------- 動き（トップと同じ見え方に揃える） ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  var hero = document.querySelector('.hero');
  if (hero) {
    var heroCol = hero.querySelector('.hero-copy');
    if (heroCol && !reduce) {
      Array.prototype.forEach.call(heroCol.children, function (el) { el.classList.add('hero-anim'); });
    }
    var markReady = function () { hero.classList.add('hero-ready'); };
    requestAnimationFrame(function () { requestAnimationFrame(markReady); });
    setTimeout(markReady, 400); /* 描画が止まっている環境への保険 */
  }

  /* ---------- ヒーローの業種切替（トップのみ。写真が2枚以上あるときだけ動く） ----------
     一次産業の写真をラベル付きでクロスフェードする。reduce 指定時は1枚目で固定。 */
  (function () {
    var slides = document.querySelectorAll('.hero-bg .hero-slide');
    if (slides.length < 2) return;
    var captions = document.querySelectorAll('.hero-captions [data-slide]');
    var INTERVAL_MS = 7000;
    var TICK_MS = 100;
    var current = 0;
    var elapsed = 0;

    function show(index) {
      current = index;
      elapsed = 0;
      Array.prototype.forEach.call(slides, function (img, i) {
        img.classList.toggle('is-active', i === index);
      });
      Array.prototype.forEach.call(captions, function (btn, i) {
        btn.setAttribute('aria-pressed', i === index ? 'true' : 'false');
        btn.style.setProperty('--cap-progress', '0%');
      });
    }

    Array.prototype.forEach.call(captions, function (btn) {
      btn.addEventListener('click', function () {
        show(Number(btn.getAttribute('data-slide')) || 0);
      });
    });

    show(0);
    if (reduce) return;
    /* 進行線を伸ばしつつ、間隔が満ちたら次へ。クリックで切り替えた時は show() が elapsed を戻す */
    setInterval(function () {
      elapsed += TICK_MS;
      var active = captions[current];
      if (active) active.style.setProperty('--cap-progress', Math.min(100, elapsed / INTERVAL_MS * 100) + '%');
      if (elapsed >= INTERVAL_MS) show((current + 1) % slides.length);
    }, TICK_MS);
  })();

  var targets = document.querySelectorAll(
    '.section-head, .service-card, .spot-card, .field-card, .plan, .tier, .ms-item, .cond-box, .opt-row, .cta-card, .faq-item, .flow-item, .tl-item, .option-wrap'
  );
  function showAll() {
    Array.prototype.forEach.call(targets, function (el) { el.classList.add('is-in'); });
  }
  if (reduce || !hasIO) {
    showAll();
  } else {
    Array.prototype.forEach.call(targets, function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var sibs = Array.prototype.slice.call(e.target.parentNode.children);
        e.target.style.transitionDelay = Math.min(sibs.indexOf(e.target), 5) * 0.08 + 's';
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
    setTimeout(showAll, 3000); /* 監視が働かない環境でも必ず見せる */
  }

  /* ---------- ヘッダーの影・下部の相談バー ----------
     上端の進捗バーは「遊びが多すぎる」ため撤去した（9/9）。 */

  /* 問い合わせ先はページごとに違う（トップは #contact、下層は ../../index.html#contact）。
     ヘッダーのお問い合わせボタンから同じ行き先を借りる。 */
  var headerContact = document.querySelector('.header-actions a[href*="#contact"]');
  var contactHref = headerContact ? headerContact.getAttribute('href') : '#contact';

  var cta = document.createElement('div');
  cta.className = 'sticky-cta';
  cta.innerHTML =
    '<div class="sticky-cta-inner">' +
    '<p>まずは30分、現状を聞かせてください<small>相談だけでも歓迎です。2営業日以内にご返信します。</small></p>' +
    '<a class="btn btn-fill" href="' + contactHref + '">無料で相談する<span class="arrow" aria-hidden="true">→</span></a>' +
    '</div>';
  document.body.appendChild(cta);
  var contactSec = document.getElementById('contact') || document.getElementById('cta');

  function applyScrollState() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    var passedHero = y > window.innerHeight * 0.8;
    var atContact = contactSec && contactSec.getBoundingClientRect().top < window.innerHeight;
    cta.classList.toggle('is-on', passedHero && !atContact);
  }
  /* 時間で間引く。rAFに任せると描画が止まった環境で二度と動かなくなる */
  var lastRun = 0, queued = null;
  function onScroll() {
    var now = Date.now();
    if (now - lastRun >= 80) { lastRun = now; applyScrollState(); return; }
    if (queued) return;
    queued = setTimeout(function () {
      queued = null; lastRun = Date.now(); applyScrollState();
    }, 80);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- ?plan= / ?type= を受け取ってフォームに反映する ----------
     サービスページの「このプランで相談する」は ?plan=グロース#contact-form で来る。
     受け取り側が無いとクエリが素通りして、押した意味が消えるため。 */
  (function () {
    var q = new URLSearchParams(window.location.search);
    var plan = q.get('plan');
    var type = q.get('type');
    if (!plan && !type) return;
    document.querySelectorAll('form[data-lead-form]').forEach(function (form) {
      if (type) {
        var sel = form.elements.namedItem('type');
        if (sel) {
          var hit = Array.prototype.find.call(sel.options, function (o) { return o.value === type; });
          if (hit) sel.value = type;
        }
      }
      if (plan) {
        var box = form.elements.namedItem('message');
        if (box && box.value.trim() === '') box.value = 'ご希望プラン：' + plan;
      }
    });
  })();

})();
