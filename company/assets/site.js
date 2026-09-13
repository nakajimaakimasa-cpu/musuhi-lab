/* 全ページ共通のふるまい（トップ v3.html も下層も、このファイル1本）。
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
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
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
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = reduceMQ.matches;
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

  /* ---------- トップのスライダー ----------
     写真が 5 秒ごとに切り替わり、下端の列がそれに追従する。
     PC: 列にマウスを載せると写真が切り替わる。列自体はリンクで、押すとそのページへ。
     1024px 以下: 横スライド。スワイプと左下の線で切替。
     マウスを載せている間・フォーカス中・タブが隠れている間は送らない。reduce 指定時は自動送りしない。 */
  (function () {
    var root = document.querySelector('.ls');
    if (!root) return;
    var slides = root.querySelectorAll('.ls-slide');
    var thumbs = root.querySelectorAll('.ls-thumb');
    var dots = root.querySelectorAll('.ls-dots button');
    var live = root.querySelector('[data-ls-live]');
    if (slides.length < 2) return;

    var INTERVAL_MS = 5000;
    var LEAVE_MS = 1000;
    var timer = null;
    var current = 0;
    var held = false;
    var isNarrow = function () { return window.innerWidth <= 1024; };

    function arm() {
      clearTimeout(timer);
      if (reduce) return;
      timer = setTimeout(function () {
        if (held || document.hidden) { arm(); return; }
        show(current + 1);
      }, INTERVAL_MS);
    }

    function show(index) {
      var next = (index + slides.length) % slides.length;
      var prev = slides[current];
      if (next !== current) {
        /* 退場中の写真は寄りを止めない（フェード中に縮んで見えるのを防ぐ）。スマホは左へ流す */
        prev.classList.add('is-leaving', 'is-prev');
        setTimeout(function () { prev.classList.remove('is-leaving'); }, LEAVE_MS);
      }
      current = next;
      Array.prototype.forEach.call(slides, function (el, i) {
        el.classList.toggle('is-active', i === next);
        if (i !== next && el !== prev) el.classList.remove('is-prev');
        el.setAttribute('aria-hidden', i === next ? 'false' : 'true');
        var link = el.querySelector('.ls-link');
        if (link) link.tabIndex = i === next ? 0 : -1; /* 見えていない写真のリンクに Tab で止まらない */
      });
      Array.prototype.forEach.call(thumbs, function (el, i) { el.classList.toggle('is-active', i === next); });
      Array.prototype.forEach.call(dots, function (el, i) {
        el.classList.toggle('is-active', i === next);
        if (i === next) el.setAttribute('aria-current', 'true'); else el.removeAttribute('aria-current');
      });
      if (live) live.textContent = slides[next].getAttribute('aria-label') || '';
      var after = slides[(next + 1) % slides.length].querySelector('img');
      if (after && after.loading === 'lazy') after.loading = 'eager';
      arm();
    }

    /* PC: 列にマウスを載せると切替。フォーカスでも同じ */
    Array.prototype.forEach.call(thumbs, function (t, i) {
      t.addEventListener('mouseenter', function () { if (!isNarrow()) show(i); });
      t.addEventListener('focusin', function () { if (!isNarrow()) show(i); });
    });
    Array.prototype.forEach.call(dots, function (d, i) {
      d.addEventListener('click', function () { show(i); });
    });

    /* 載せている間・フォーカス中は送らない（WCAG 2.2.2 の一時停止） */
    root.addEventListener('mouseenter', function () { held = true; });
    root.addEventListener('mouseleave', function () { held = false; });
    root.addEventListener('focusin', function () { held = true; });
    root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) held = false; });

    /* スワイプ（1024px 以下） */
    var touchX = null;
    root.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; held = true; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      held = false;
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) < 40) return;
      show(dx < 0 ? current + 1 : current - 1);
    }, { passive: true });

    /* キーボード（← →） */
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { show(current + 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { show(current - 1); e.preventDefault(); }
    });

    if (reduceMQ.addEventListener) {
      reduceMQ.addEventListener('change', function (e) { reduce = e.matches; if (reduce) clearTimeout(timer); else arm(); });
    }

    Array.prototype.forEach.call(slides, function (el, i) {
      el.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
      var link = el.querySelector('.ls-link');
      if (link) link.tabIndex = i === 0 ? 0 : -1;
    });
    arm();
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
  var headerContact = document.querySelector('.site-header [data-contact]') || document.querySelector('.header-actions a[href*="#contact"]');
  var contactHref = headerContact ? headerContact.getAttribute('href') : '#contact';
  var isTop = Boolean(document.querySelector('main.page-top'));

  var cta = document.createElement('div');
  cta.className = 'sticky-cta';
  cta.innerHTML =
    '<div class="sticky-cta-inner">' +
    '<p>まずは30分、現状を聞かせてください<small>相談だけでも歓迎です。2営業日以内にご返信します。</small></p>' +
    '<a class="btn btn-fill" href="' + contactHref + '">無料で相談する<span class="arrow" aria-hidden="true">→</span></a>' +
    '</div>';
  if (!isTop) document.body.appendChild(cta); /* トップは追従バーを出さない（1画面構成のため） */
  var contactSec = document.getElementById('contact') || document.getElementById('cta');
  var footerEl = document.querySelector('.site-footer');

  function applyScrollState() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    var passedHero = y > window.innerHeight * 0.8;
    var atContact = contactSec && contactSec.getBoundingClientRect().top < window.innerHeight;
    var atFooter = footerEl && footerEl.getBoundingClientRect().top < window.innerHeight;
    cta.classList.toggle('is-on', passedHero && !atContact && !atFooter);
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
