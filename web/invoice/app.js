// インボイス対応 請求書・領収書メーカー (A4)
document.addEventListener("DOMContentLoaded", () => {
  const A4_W = 2480;
  const A4_H = 3508;

  const canvas = document.getElementById("invoice-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = A4_W;
  canvas.height = A4_H;

  const typeRadios = document.querySelectorAll('input[name="doc_type"]');
  const inputClient = document.getElementById("input-client");
  const inputDate = document.getElementById("input-date");
  const inputDocNum = document.getElementById("input-doc-num");
  const inputDueDate = document.getElementById("input-due-date");
  const groupDueDate = document.getElementById("group-due-date");
  const inputSubject = document.getElementById("input-subject");

  const inputSenderName = document.getElementById("input-sender-name");
  const inputSenderInvoiceId = document.getElementById("input-sender-invoice-id");
  const inputSenderAddress = document.getElementById("input-sender-address");
  const inputSenderTel = document.getElementById("input-sender-tel");
  const inputSenderEmail = document.getElementById("input-sender-email");
  const checkStamp = document.getElementById("check-stamp");

  const itemsList = document.getElementById("items-list");
  const btnAddItem = document.getElementById("btn-add-item");
  const labelSubtotal = document.getElementById("label-subtotal");
  const labelTax10 = document.getElementById("label-tax10");
  const labelTax8 = document.getElementById("label-tax8");
  const labelTotal = document.getElementById("label-total");

  const cardBankInfo = document.getElementById("card-bank-info");
  const inputBankInfo = document.getElementById("input-bank-info");
  const inputNotes = document.getElementById("input-notes");
  const btnDownloadInvoice = document.getElementById("btn-download-invoice");
  const previewDocTitle = document.getElementById("preview-doc-title");

  const btnGuideModal = document.getElementById("btn-guide-modal");
  const btnShowGuide = document.getElementById("btn-show-guide");
  const guideModal = document.getElementById("guide-modal");
  const modalClose = document.getElementById("modal-close");
  const modalClose2 = document.getElementById("modal-close-btn2");

  // 初期日付
  const today = new Date();
  inputDate.value = today.toISOString().split("T")[0];
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  inputDueDate.value = nextMonth.toISOString().split("T")[0];

  let items = [
    { name: "Webサイト企画・デザイン制作一式", qty: 1, price: 150000, taxRate: 10 },
    { name: "スマートフォン表示レスポンシブ対応", qty: 1, price: 50000, taxRate: 10 },
    { name: "取材用資料・お茶菓子代（軽減税率対象）", qty: 2, price: 2500, taxRate: 8 }
  ];

  function renderItemsRows() {
    itemsList.innerHTML = "";
    items.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "item-row";
      row.innerHTML = `
        <input type="text" placeholder="品名・品目" value="${item.name}" data-idx="${index}" data-field="name">
        <input type="number" placeholder="数量" min="1" value="${item.qty}" data-idx="${index}" data-field="qty">
        <input type="number" placeholder="単価(税抜)" min="0" value="${item.price}" data-idx="${index}" data-field="price">
        <select data-idx="${index}" data-field="taxRate">
          <option value="10" ${item.taxRate === 10 ? "selected" : ""}>10%</option>
          <option value="8" ${item.taxRate === 8 ? "selected" : ""}>軽減 8%</option>
        </select>
        <button type="button" class="btn-sm btn-del" data-idx="${index}">✕</button>
      `;
      itemsList.appendChild(row);
    });

    attachItemListeners();
    calculateAndRender();
  }

  function attachItemListeners() {
    itemsList.querySelectorAll("input, select").forEach(el => {
      el.addEventListener("input", (e) => {
        const idx = e.target.dataset.idx;
        const field = e.target.dataset.field;
        items[idx][field] = field === "name" ? e.target.value : Number(e.target.value);
        calculateAndRender();
      });
    });

    itemsList.querySelectorAll(".btn-del").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        items.splice(idx, 1);
        renderItemsRows();
      });
    });
  }

  btnAddItem.addEventListener("click", () => {
    items.push({ name: "", qty: 1, price: 0, taxRate: 10 });
    renderItemsRows();
  });

  typeRadios.forEach(r => {
    r.addEventListener("change", () => {
      const isReceipt = getDocType() === "receipt";
      groupDueDate.style.display = isReceipt ? "none" : "block";
      cardBankInfo.style.display = isReceipt ? "none" : "block";
      previewDocTitle.textContent = isReceipt ? "👁️ プレビュー (A4領収書)" : "👁️ プレビュー (A4適格請求書)";
      calculateAndRender();
    });
  });

  function getDocType() {
    return document.querySelector('input[name="doc_type"]:checked').value;
  }

  // 金額計算
  function calculateTotals() {
    let subtotal10 = 0;
    let subtotal8 = 0;

    items.forEach(item => {
      const amount = (item.qty || 0) * (item.price || 0);
      if (item.taxRate === 8) {
        subtotal8 += amount;
      } else {
        subtotal10 += amount;
      }
    });

    const tax10 = Math.floor(subtotal10 * 0.1);
    const tax8 = Math.floor(subtotal8 * 0.08);
    const subtotal = subtotal10 + subtotal8;
    const total = subtotal + tax10 + tax8;

    return { subtotal, subtotal10, subtotal8, tax10, tax8, total };
  }

  function calculateAndRender() {
    const totals = calculateTotals();
    labelSubtotal.textContent = `¥${totals.subtotal.toLocaleString()}`;
    labelTax10.textContent = `¥${totals.tax10.toLocaleString()} (税抜 ¥${totals.subtotal10.toLocaleString()})`;
    labelTax8.textContent = `¥${totals.tax8.toLocaleString()} (税抜 ¥${totals.subtotal8.toLocaleString()})`;
    labelTotal.textContent = `¥${totals.total.toLocaleString()}`;

    renderCanvas(totals);
  }

  // フォーム全体の変更リスナー
  [inputClient, inputDate, inputDocNum, inputDueDate, inputSubject, inputSenderName, inputSenderInvoiceId, inputSenderAddress, inputSenderTel, inputSenderEmail, checkStamp, inputBankInfo, inputNotes].forEach(el => {
    el.addEventListener("input", calculateAndRender);
    el.addEventListener("change", calculateAndRender);
  });

  // Canvas描画
  function renderCanvas(totals) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, A4_W, A4_H);

    const mX = 140;
    const mY = 140;
    const contentW = A4_W - mX * 2;
    const isReceipt = getDocType() === "receipt";

    // タイトル
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 72px 'Noto Sans JP', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(isReceipt ? "領　収　書" : "御　請　求　書", A4_W / 2, mY + 70);

    // 書類番号＆発行日
    ctx.font = "30px 'Noto Sans JP', sans-serif";
    ctx.textAlign = "right";
    ctx.fillStyle = "#334155";
    if (inputDocNum.value) {
      ctx.fillText(`No. ${inputDocNum.value}`, mX + contentW, mY + 30);
    }
    const dStr = inputDate.value ? `${inputDate.value.replace(/-/g, "/")} 発行` : "";
    ctx.fillText(dStr, mX + contentW, mY + 75);

    // 宛名
    const clientY = mY + 180;
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 52px 'Noto Sans JP', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(inputClient.value || "御中", mX, clientY);

    // 下線
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#0f172a";
    ctx.moveTo(mX, clientY + 18);
    ctx.lineTo(mX + contentW * 0.58, clientY + 18);
    ctx.stroke();

    // 件名
    if (inputSubject.value) {
      ctx.font = "32px 'Noto Sans JP', sans-serif";
      ctx.fillStyle = "#475569";
      ctx.fillText(`件名：${inputSubject.value}`, mX, clientY + 70);
    }

    // 発行者情報（右側）
    const senderX = mX + contentW * 0.62;
    let senderY = clientY - 40;
    ctx.textAlign = "left";
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 38px 'Noto Sans JP', sans-serif";
    ctx.fillText(inputSenderName.value || "", senderX, senderY);

    if (inputSenderInvoiceId.value) {
      senderY += 45;
      ctx.font = "26px 'Noto Sans JP', sans-serif";
      ctx.fillStyle = "#0284c7";
      ctx.fillText(`登録番号: ${inputSenderInvoiceId.value}`, senderX, senderY);
    }

    senderY += 40;
    ctx.font = "26px 'Noto Sans JP', sans-serif";
    ctx.fillStyle = "#475569";
    ctx.fillText(inputSenderAddress.value || "", senderX, senderY);

    if (inputSenderTel.value || inputSenderEmail.value) {
      senderY += 36;
      ctx.fillText(`TEL: ${inputSenderTel.value} / ${inputSenderEmail.value}`, senderX, senderY);
    }

    // 電子印鑑（角印スタンプ描画）
    if (checkStamp.checked) {
      const stampX = mX + contentW - 130;
      const stampY = clientY - 60;
      drawStamp(ctx, stampX, stampY, 110, inputSenderName.value || "印");
    }

    // 御請求金額 / 領収金額ハイライト枠
    const totalBoxY = clientY + 130;
    ctx.fillStyle = "#f0f9ff";
    ctx.fillRect(mX, totalBoxY, contentW * 0.58, 120);
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 3;
    ctx.strokeRect(mX, totalBoxY, contentW * 0.58, 120);

    ctx.fillStyle = "#0369a1";
    ctx.font = "bold 34px 'Noto Sans JP', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(isReceipt ? "領収金額 (税込)" : "ご請求金額 (税込)", mX + 24, totalBoxY + 74);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 60px 'Noto Sans JP', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`¥${totals.total.toLocaleString()} -`, mX + contentW * 0.58 - 24, totalBoxY + 80);

    // お支払期日（請求書時）
    if (!isReceipt && inputDueDate.value) {
      ctx.textAlign = "left";
      ctx.fillStyle = "#475569";
      ctx.font = "28px 'Noto Sans JP', sans-serif";
      ctx.fillText(`お支払期日：${inputDueDate.value.replace(/-/g, "/")}`, mX + contentW * 0.62, totalBoxY + 74);
    }

    // 明細テーブル
    const tableY = totalBoxY + 160;
    const tableH = 1100;
    drawInvoiceTable(mX, tableY, contentW, tableH, items);

    // 金額サマリー＆税率内訳（適格請求書要件）
    const summaryY = tableY + tableH + 30;
    const summaryW = contentW * 0.45;
    const summaryX = mX + contentW - summaryW;

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(summaryX, summaryY, summaryW, 260);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.strokeRect(summaryX, summaryY, summaryW, 260);

    ctx.font = "28px 'Noto Sans JP', sans-serif";
    ctx.fillStyle = "#334155";
    ctx.textAlign = "left";
    ctx.fillText("小計 (税抜)", summaryX + 20, summaryY + 50);
    ctx.fillText("10%対象 (税抜)", summaryX + 20, summaryY + 100);
    ctx.fillText("消費税 (10%)", summaryX + 20, summaryY + 145);
    ctx.fillText("8%軽減対象 (税抜)", summaryX + 20, summaryY + 195);
    ctx.fillText("消費税 (8%)", summaryX + 20, summaryY + 240);

    ctx.textAlign = "right";
    ctx.fillText(`¥${totals.subtotal.toLocaleString()}`, summaryX + summaryW - 20, summaryY + 50);
    ctx.fillText(`¥${totals.subtotal10.toLocaleString()}`, summaryX + summaryW - 20, summaryY + 100);
    ctx.fillText(`¥${totals.tax10.toLocaleString()}`, summaryX + summaryW - 20, summaryY + 145);
    ctx.fillText(`¥${totals.subtotal8.toLocaleString()}`, summaryX + summaryW - 20, summaryY + 195);
    ctx.fillText(`¥${totals.tax8.toLocaleString()}`, summaryX + summaryW - 20, summaryY + 240);

    // 振込先・備考（請求書時）
    if (!isReceipt) {
      const bankW = contentW * 0.5;
      const bankX = mX;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#cbd5e1";
      ctx.strokeRect(bankX, summaryY, bankW, 260);

      ctx.fillStyle = "#0284c7";
      ctx.font = "bold 26px 'Noto Sans JP', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("【お振込先】", bankX + 20, summaryY + 45);

      ctx.fillStyle = "#334155";
      ctx.font = "26px 'Noto Sans JP', sans-serif";
      drawMultilineText(ctx, inputBankInfo.value || "", bankX + 20, summaryY + 90, 36);

      if (inputNotes.value) {
        ctx.fillStyle = "#64748b";
        ctx.font = "24px 'Noto Sans JP', sans-serif";
        ctx.fillText(`※備考: ${inputNotes.value}`, mX, summaryY + 310);
      }
    }
  }

  // テーブル描画
  function drawInvoiceTable(x, y, w, h, itemsData) {
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    const headerH = 65;
    ctx.beginPath();
    ctx.moveTo(x, y + headerH);
    ctx.lineTo(x + w, y + headerH);
    ctx.stroke();

    // 列幅
    const colItemW = w * 0.48;
    const colQtyW = w * 0.12;
    const colPriceW = w * 0.18;
    const colTaxW = w * 0.08;

    ctx.beginPath();
    ctx.moveTo(x + colItemW, y);
    ctx.lineTo(x + colItemW, y + h);
    ctx.moveTo(x + colItemW + colQtyW, y);
    ctx.lineTo(x + colItemW + colQtyW, y + h);
    ctx.moveTo(x + colItemW + colQtyW + colPriceW, y);
    ctx.lineTo(x + colItemW + colQtyW + colPriceW, y + h);
    ctx.moveTo(x + colItemW + colQtyW + colPriceW + colTaxW, y);
    ctx.lineTo(x + colItemW + colQtyW + colPriceW + colTaxW, y + h);
    ctx.stroke();

    // ヘッダー文字
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 28px 'Noto Sans JP', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("品名・項目", x + colItemW / 2, y + 44);
    ctx.fillText("数量", x + colItemW + colQtyW / 2, y + 44);
    ctx.fillText("単価 (税抜)", x + colItemW + colQtyW + colPriceW / 2, y + 44);
    ctx.fillText("税率", x + colItemW + colQtyW + colPriceW + colTaxW / 2, y + 44);
    ctx.fillText("金額 (税抜)", x + colItemW + colQtyW + colPriceW + colTaxW + (w - colItemW - colQtyW - colPriceW - colTaxW) / 2, y + 44);

    // 行
    const rowCount = 14;
    const rowH = (h - headerH) / rowCount;

    for (let i = 0; i < rowCount; i++) {
      const curY = y + headerH + rowH * i;
      if (i > 0) {
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, curY);
        ctx.lineTo(x + w, curY);
        ctx.stroke();
      }

      if (itemsData[i]) {
        const item = itemsData[i];
        const lineTotal = (item.qty || 0) * (item.price || 0);

        ctx.font = "26px 'Noto Sans JP', sans-serif";
        ctx.fillStyle = "#0f172a";

        // 品名
        ctx.textAlign = "left";
        ctx.fillText(item.name || "", x + 20, curY + rowH / 2 + 10);

        // 数量
        ctx.textAlign = "center";
        ctx.fillText(item.qty ? String(item.qty) : "", x + colItemW + colQtyW / 2, curY + rowH / 2 + 10);

        // 単価
        ctx.textAlign = "right";
        ctx.fillText(item.price ? `¥${item.price.toLocaleString()}` : "", x + colItemW + colQtyW + colPriceW - 20, curY + rowH / 2 + 10);

        // 税率
        ctx.textAlign = "center";
        ctx.fillText(`${item.taxRate || 10}%`, x + colItemW + colQtyW + colPriceW + colTaxW / 2, curY + rowH / 2 + 10);

        // 金額
        ctx.textAlign = "right";
        ctx.fillText(`¥${lineTotal.toLocaleString()}`, x + w - 20, curY + rowH / 2 + 10);
      }
    }
  }

  // 電子印鑑スタンプ描画
  function drawStamp(context, x, y, size, text) {
    context.save();
    context.strokeStyle = "#dc2626";
    context.fillStyle = "#dc2626";
    context.lineWidth = 4;

    // 二重枠四角印
    context.strokeRect(x, y, size, size);
    context.strokeRect(x + 6, y + 6, size - 12, size - 12);

    // 印面文字
    const cleanText = text.replace(/[^a-zA-Z0-9\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/g, "").slice(0, 4);
    context.font = "bold 24px 'Noto Serif JP', serif";
    context.textAlign = "center";

    if (cleanText.length <= 2) {
      context.fillText(cleanText.charAt(0) || "印", x + size / 2, y + size / 2 - 6);
      context.fillText(cleanText.charAt(1) || "之", x + size / 2, y + size / 2 + 26);
    } else {
      context.fillText(cleanText.slice(0, 2), x + size / 2, y + size / 2 - 6);
      context.fillText(cleanText.slice(2, 4), x + size / 2, y + size / 2 + 26);
    }

    context.restore();
  }

  function drawMultilineText(context, text, x, y, lineHeight) {
    const lines = text.split("\n");
    lines.forEach((line, i) => {
      context.fillText(line, x, y + lineHeight * i);
    });
  }

  // 保存
  btnDownloadInvoice.addEventListener("click", () => {
    const isReceipt = getDocType() === "receipt";
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${isReceipt ? "領収書" : "請求書"}_${inputClient.value.trim() || "document"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, "image/png");

    if (typeof window.gtag === "function") {
      window.gtag("event", isReceipt ? "download_receipt" : "download_invoice");
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

  // 初期描画
  renderItemsRows();
  if (document.fonts) {
    document.fonts.ready.then(calculateAndRender);
  }
});
