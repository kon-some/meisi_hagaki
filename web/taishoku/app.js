// スマホで退職届・退職願ジェネレーター (縦書き正式便箋)
document.addEventListener("DOMContentLoaded", () => {
  // 便箋解像度 (B5/A4兼用 300DPI相当) = 2120 × 3000 px
  const CANVAS_W = 2120;
  const CANVAS_H = 3000;

  const canvas = document.getElementById("taishoku-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;

  const typeRadios = document.querySelectorAll('input[name="doc_type"]');
  const selectReason = document.getElementById("select-reason");
  const inputRetireDate = document.getElementById("input-retire-date");
  const inputSubmitDate = document.getElementById("input-submit-date");
  const inputDept = document.getElementById("input-dept");
  const inputMyName = document.getElementById("input-my-name");
  const checkStamp = document.getElementById("check-stamp");

  const inputCompanyName = document.getElementById("input-company-name");
  const inputBossTitle = document.getElementById("input-boss-title");
  const inputBossName = document.getElementById("input-boss-name");
  const btnDownload = document.getElementById("btn-download");
  const previewDocTitle = document.getElementById("preview-doc-title");

  const btnGuideModal = document.getElementById("btn-guide-modal");
  const btnShowGuide = document.getElementById("btn-show-guide");
  const guideModal = document.getElementById("guide-modal");
  const modalClose = document.getElementById("modal-close");
  const modalClose2 = document.getElementById("modal-close-btn2");

  // 初期日付（提出日: 今日、退職日: 1ヶ月後）
  const today = new Date();
  inputSubmitDate.value = today.toISOString().split("T")[0];
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  inputRetireDate.value = nextMonth.toISOString().split("T")[0];

  function getDocType() {
    return document.querySelector('input[name="doc_type"]:checked').value;
  }

  // 西暦 ➔ 和暦漢数字変換
  function toJapaneseDateKanji(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;

    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();

    // 令和 (2019年5月1日〜)
    const reiwaYear = year - 2018;
    const yearKanji = reiwaYear === 1 ? "元" : toKanjiNumber(reiwaYear);
    const monthKanji = toKanjiNumber(month);
    const dayKanji = toKanjiNumber(day);

    return `令和${yearKanji}年${monthKanji}月${dayKanji}日`;
  }

  function toKanjiNumber(num) {
    const kanjiDigits = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
    if (num <= 9) return kanjiDigits[num];
    if (num === 10) return "十";
    if (num < 20) return `十${kanjiDigits[num % 10]}`;
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    return `${kanjiDigits[tens]}十${ones > 0 ? kanjiDigits[ones] : ""}`;
  }

  // 縦書き描画ヘルパー
  function drawVerticalText(context, text, x, startY, fontSize, letterSpacing = 16) {
    context.font = `${fontSize}px 'Noto Serif JP', serif`;
    context.textAlign = "center";
    let curY = startY;

    const chars = text.split("");
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      if (c === "、" || c === "，") {
        context.fillText(c, x + fontSize * 0.35, curY - fontSize * 0.2);
      } else if (c === "。" || c === "．") {
        context.fillText(c, x + fontSize * 0.35, curY - fontSize * 0.2);
      } else if (c === "ー" || c === "—" || c === "-") {
        context.save();
        context.translate(x, curY);
        context.rotate(Math.PI / 2);
        context.fillText("|", 0, 0);
        context.restore();
      } else {
        context.fillText(c, x, curY);
      }
      curY += fontSize + letterSpacing;
    }
  }

  // 下寄せ縦書き描画
  function drawVerticalTextBottom(context, text, x, bottomY, fontSize, letterSpacing = 16) {
    const totalH = text.length * fontSize + (text.length - 1) * letterSpacing;
    const startY = bottomY - totalH + fontSize;
    drawVerticalText(context, text, x, startY, fontSize, letterSpacing);
  }

  // 認印スタンプ描画（丸印）
  function drawCircleStamp(context, x, y, radius, nameText) {
    context.save();
    context.strokeStyle = "#dc2626";
    context.fillStyle = "#dc2626";
    context.lineWidth = 5;

    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.stroke();

    context.beginPath();
    context.arc(x, y, radius - 6, 0, Math.PI * 2);
    context.stroke();

    const clean = nameText.replace(/[^a-zA-Z0-9\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/g, "").slice(0, 3);
    context.font = `bold ${Math.floor(radius * 0.72)}px 'Noto Serif JP', serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";

    if (clean.length === 1) {
      context.fillText(clean, x, y);
    } else if (clean.length === 2) {
      context.fillText(clean.charAt(0), x, y - radius * 0.35);
      context.fillText(clean.charAt(1), x, y + radius * 0.35);
    } else {
      context.font = `bold ${Math.floor(radius * 0.52)}px 'Noto Serif JP', serif`;
      context.fillText(clean.charAt(0), x, y - radius * 0.45);
      context.fillText(clean.charAt(1), x, y);
      context.fillText(clean.charAt(2), x, y + radius * 0.45);
    }

    context.restore();
  }

  function renderTaishoku() {
    const isTodoke = getDocType() === "todoke";
    previewDocTitle.textContent = isTodoke ? "👁️ プレビュー (退職届・縦書き便箋)" : "👁️ プレビュー (退職願・縦書き便箋)";

    // 便箋白地
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // 便箋の上品な薄い縦罫線 (15本)
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    const lineMarginTop = 260;
    const lineMarginBottom = 2600;
    const colStep = 105;
    const rightMargin = 220;

    for (let c = 0; c < 16; c++) {
      const lineX = CANVAS_W - rightMargin - colStep * c;
      ctx.beginPath();
      ctx.moveTo(lineX, lineMarginTop);
      ctx.lineTo(lineX, lineMarginBottom);
      ctx.stroke();
    }

    ctx.fillStyle = "#0f172a";

    // 1. 表題（右端から2列目中央）
    const titleColX = CANVAS_W - rightMargin - colStep * 2 + colStep / 2;
    const titleText = isTodoke ? "退　職　届" : "退　職　願";
    drawVerticalText(ctx, titleText, titleColX, 480, 72, 36);

    // 2. 「私事、」（行頭は下寄せマナー）
    const shijiColX = CANVAS_W - rightMargin - colStep * 4 + colStep / 2;
    drawVerticalTextBottom(ctx, "私事、", shijiColX, 2350, 48, 16);

    // 3. 本文
    const bodyCol1X = CANVAS_W - rightMargin - colStep * 5 + colStep / 2;
    const reasonText = selectReason.value || "一身上の都合により、";
    drawVerticalText(ctx, `このたび、${reasonText}`, bodyCol1X, 360, 46, 18);

    const bodyCol2X = CANVAS_W - rightMargin - colStep * 6 + colStep / 2;
    const retireDateKanji = toJapaneseDateKanji(inputRetireDate.value);
    drawVerticalText(ctx, `${retireDateKanji}をもって、`, bodyCol2X, 360, 46, 18);

    const bodyCol3X = CANVAS_W - rightMargin - colStep * 7 + colStep / 2;
    const endingText = isTodoke ? "退職いたしたくお届け申し上げます。" : "退職いたしたくお願い申し上げます。";
    drawVerticalText(ctx, endingText, bodyCol3X, 360, 46, 18);

    // 4. 提出日
    const submitColX = CANVAS_W - rightMargin - colStep * 9 + colStep / 2;
    const submitDateKanji = toJapaneseDateKanji(inputSubmitDate.value);
    drawVerticalText(ctx, submitDateKanji, submitColX, 440, 42, 16);

    // 5. 所属部署（下寄せ）
    const deptColX = CANVAS_W - rightMargin - colStep * 10 + colStep / 2;
    if (inputDept.value) {
      drawVerticalTextBottom(ctx, inputDept.value, deptColX, 2150, 42, 16);
    }

    // 6. 氏名（下寄せ）＋ 認印スタンプ
    const nameColX = CANVAS_W - rightMargin - colStep * 11 + colStep / 2;
    const myName = inputMyName.value || "";
    drawVerticalTextBottom(ctx, myName, nameColX, 2300, 52, 22);

    if (checkStamp.checked && myName) {
      const stampX = nameColX;
      const stampY = 2420;
      drawCircleStamp(ctx, stampX, stampY, 52, myName);
    }

    // 7. 提出先会社名
    const compColX = CANVAS_W - rightMargin - colStep * 13 + colStep / 2;
    drawVerticalText(ctx, inputCompanyName.value || "", compColX, 360, 46, 18);

    // 8. 提出先代表者役職・氏名
    const bossColX = CANVAS_W - rightMargin - colStep * 14 + colStep / 2;
    const bossTitle = inputBossTitle.value ? `${inputBossTitle.value}　` : "";
    const bossFull = `${bossTitle}${inputBossName.value || ""}`;
    drawVerticalText(ctx, bossFull, bossColX, 420, 50, 20);
  }

  // リスナー
  typeRadios.forEach(r => r.addEventListener("change", renderTaishoku));
  [selectReason, inputRetireDate, inputSubmitDate, inputDept, inputMyName, checkStamp, inputCompanyName, inputBossTitle, inputBossName].forEach(el => {
    el.addEventListener("input", renderTaishoku);
    el.addEventListener("change", renderTaishoku);
  });

  // 保存
  btnDownload.addEventListener("click", () => {
    const isTodoke = getDocType() === "todoke";
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${isTodoke ? "退職届" : "退職願"}_${inputMyName.value.trim() || "document"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, "image/png");

    if (typeof window.gtag === "function") {
      window.gtag("event", isTodoke ? "download_taishokutodoke" : "download_taishokunegai");
    }
  });

  // モーダル
  function openGuide() { guideModal.classList.remove("hidden"); }
  function closeGuide() { guideModal.classList.add("hidden"); }
  btnGuideModal.addEventListener("click", openGuide);
  btnShowGuide.addEventListener("click", openGuide);
  modalClose.addEventListener("click", closeGuide);
  modalClose2.addEventListener("click", closeGuide);
  guideModal.addEventListener("click", (e) => {
    if (e.target === guideModal) closeGuide();
  });

  renderTaishoku();
  if (document.fonts) {
    document.fonts.ready.then(renderTaishoku);
  }
});
