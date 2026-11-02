// スマホで履歴書ジェネレーター (JIS規格 A4)
document.addEventListener("DOMContentLoaded", () => {
  // A4 (300 DPI) = 2480 × 3508 px
  const A4_W = 2480;
  const A4_H = 3508;

  const canvas = document.getElementById("resume-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = A4_W;
  canvas.height = A4_H;

  // フォーム要素
  const inputName = document.getElementById("input-name");
  const inputKana = document.getElementById("input-kana");
  const inputBirth = document.getElementById("input-birth");
  const selectGender = document.getElementById("select-gender");
  const inputZip = document.getElementById("input-zip");
  const inputAddress = document.getElementById("input-address");
  const inputTel = document.getElementById("input-tel");
  const inputEmail = document.getElementById("input-email");
  const inputPhoto = document.getElementById("input-photo");
  const inputPr = document.getElementById("input-pr");
  const inputHope = document.getElementById("input-hope");

  const careerList = document.getElementById("career-list");
  const licenseList = document.getElementById("license-list");
  const btnAddCareer = document.getElementById("btn-add-career");
  const btnAddLicense = document.getElementById("btn-add-license");
  const btnDownloadPdf = document.getElementById("btn-download-pdf");

  const btnGuideModal = document.getElementById("btn-guide-modal");
  const btnShowGuide = document.getElementById("btn-show-guide");
  const guideModal = document.getElementById("guide-modal");
  const modalClose = document.getElementById("modal-close");
  const modalClose2 = document.getElementById("modal-close-btn2");

  let uploadedPhotoImg = null;

  // 初期学歴・職歴データ
  let careers = [
    { year: "2014", month: "3", text: "〇〇県立〇〇高等学校 卒業" },
    { year: "2014", month: "4", text: "〇〇大学 経済学部 入学" },
    { year: "2018", month: "3", text: "〇〇大学 経済学部 卒業" },
    { year: "2018", month: "4", text: "株式会社〇〇 入社（営業部配属）" },
    { year: "2024", month: "3", text: "一身上の都合により退職" },
    { year: "", month: "", text: "現在に至る" },
    { year: "", month: "", text: "以上" }
  ];

  // 初期資格データ
  let licenses = [
    { year: "2016", month: "6", text: "普通自動車第一種運転免許 取得" },
    { year: "2019", month: "10", text: "日商簿記検定 2級 合格" },
    { year: "2021", month: "11", text: "TOEIC Listening & Reading Test 750点 取得" }
  ];

  function renderDynamicRows() {
    // 学歴・職歴
    careerList.innerHTML = "";
    careers.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "dynamic-row-item";
      row.innerHTML = `
        <input type="text" style="width: 70px;" placeholder="年" value="${item.year}" data-idx="${index}" data-type="career" data-field="year">
        <input type="text" style="width: 50px;" placeholder="月" value="${item.month}" data-idx="${index}" data-type="career" data-field="month">
        <input type="text" style="flex: 1;" placeholder="内容" value="${item.text}" data-idx="${index}" data-type="career" data-field="text">
        <button type="button" class="btn-sm btn-del" data-idx="${index}" data-type="career">✕</button>
      `;
      careerList.appendChild(row);
    });

    // 免許・資格
    licenseList.innerHTML = "";
    licenses.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "dynamic-row-item";
      row.innerHTML = `
        <input type="text" style="width: 70px;" placeholder="年" value="${item.year}" data-idx="${index}" data-type="license" data-field="year">
        <input type="text" style="width: 50px;" placeholder="月" value="${item.month}" data-idx="${index}" data-type="license" data-field="month">
        <input type="text" style="flex: 1;" placeholder="資格・免許名" value="${item.text}" data-idx="${index}" data-type="license" data-field="text">
        <button type="button" class="btn-sm btn-del" data-idx="${index}" data-type="license">✕</button>
      `;
      licenseList.appendChild(row);
    });

    attachDynamicListeners();
    renderResume();
  }

  function attachDynamicListeners() {
    careerList.querySelectorAll("input").forEach(input => {
      input.addEventListener("input", (e) => {
        const idx = e.target.dataset.idx;
        const field = e.target.dataset.field;
        careers[idx][field] = e.target.value;
        renderResume();
      });
    });

    careerList.querySelectorAll(".btn-del").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        careers.splice(idx, 1);
        renderDynamicRows();
      });
    });

    licenseList.querySelectorAll("input").forEach(input => {
      input.addEventListener("input", (e) => {
        const idx = e.target.dataset.idx;
        const field = e.target.dataset.field;
        licenses[idx][field] = e.target.value;
        renderResume();
      });
    });

    licenseList.querySelectorAll(".btn-del").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        licenses.splice(idx, 1);
        renderDynamicRows();
      });
    });
  }

  btnAddCareer.addEventListener("click", () => {
    careers.push({ year: "", month: "", text: "" });
    renderDynamicRows();
  });

  btnAddLicense.addEventListener("click", () => {
    licenses.push({ year: "", month: "", text: "" });
    renderDynamicRows();
  });

  // 写真アップロード
  inputPhoto.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const img = new Image();
        img.onload = () => {
          uploadedPhotoImg = img;
          renderResume();
        };
        img.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // フォーム全体のリスナー
  [inputName, inputKana, inputBirth, selectGender, inputZip, inputAddress, inputTel, inputEmail, inputPr, inputHope].forEach(el => {
    el.addEventListener("input", renderResume);
    el.addEventListener("change", renderResume);
  });

  // 年齢計算
  function calculateAge(birthStr) {
    if (!birthStr) return "";
    const birth = new Date(birthStr);
    if (isNaN(birth)) return "";
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `（満 ${age} 歳）`;
  }

  // 和暦・西暦フォーマット
  function formatBirth(birthStr) {
    if (!birthStr) return "";
    const d = new Date(birthStr);
    if (isNaN(d)) return birthStr;
    return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日生`;
  }

  // Canvasレンダリング（JIS規格A4）
  function renderResume() {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, A4_W, A4_H);

    // 外枠マージン
    const mX = 140;
    const mY = 140;
    const contentW = A4_W - mX * 2;
    const contentH = A4_H - mY * 2;

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;

    // ヘッダー部
    ctx.fillStyle = "#000000";
    ctx.font = "bold 64px 'Noto Sans JP', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("履　歴　書", mX + 20, mY + 60);

    // 作成日付
    const today = new Date();
    ctx.font = "32px 'Noto Sans JP', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${today.getFullYear()} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日現在`, mX + contentW - 400, mY + 60);

    const startY = mY + 90;

    // 写真枠 (30×40mm 比率)
    const photoW = 340;
    const photoH = 450;
    const photoX = mX + contentW - photoW;
    const photoY = startY;

    ctx.strokeRect(photoX, photoY, photoW, photoH);
    if (uploadedPhotoImg) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(photoX, photoY, photoW, photoH);
      ctx.clip();
      ctx.drawImage(uploadedPhotoImg, photoX, photoY, photoW, photoH);
      ctx.restore();
    } else {
      ctx.fillStyle = "#666666";
      ctx.font = "26px 'Noto Sans JP', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("写真を貼る位置", photoX + photoW / 2, photoY + photoH / 2 - 30);
      ctx.font = "22px 'Noto Sans JP', sans-serif";
      ctx.fillText("（縦 40mm × 横 30mm）", photoX + photoW / 2, photoY + photoH / 2 + 10);
      ctx.fillText("裏面に氏名記入", photoX + photoW / 2, photoY + photoH / 2 + 45);
    }

    // 基本情報テーブル（写真の左側）
    const infoW = contentW - photoW - 30;
    ctx.strokeRect(mX, startY, infoW, photoH);

    // ふりがな枠 (高さ 60)
    ctx.beginPath();
    ctx.moveTo(mX, startY + 60);
    ctx.lineTo(mX + infoW, startY + 60);
    ctx.stroke();

    ctx.fillStyle = "#333333";
    ctx.font = "24px 'Noto Sans JP', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("ふりがな", mX + 16, startY + 42);

    ctx.fillStyle = "#000000";
    ctx.font = "32px 'Noto Sans JP', sans-serif";
    ctx.fillText(inputKana.value || "", mX + 160, startY + 42);

    // 氏名枠 (高さ 170)
    ctx.beginPath();
    ctx.moveTo(mX, startY + 230);
    ctx.lineTo(mX + infoW, startY + 230);
    ctx.stroke();

    ctx.fillStyle = "#333333";
    ctx.font = "28px 'Noto Sans JP', sans-serif";
    ctx.fillText("氏　名", mX + 16, startY + 150);

    ctx.fillStyle = "#000000";
    ctx.font = "bold 64px 'Noto Sans JP', sans-serif";
    ctx.fillText(inputName.value || "", mX + 160, startY + 160);

    // 性別枠
    const gender = selectGender.value;
    if (gender) {
      ctx.font = "32px 'Noto Sans JP', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(gender, mX + infoW - 30, startY + 150);
    }

    // 生年月日枠 (高さ 90)
    ctx.beginPath();
    ctx.moveTo(mX, startY + 320);
    ctx.lineTo(mX + infoW, startY + 320);
    ctx.stroke();

    ctx.fillStyle = "#333333";
    ctx.font = "26px 'Noto Sans JP', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("生年月日", mX + 16, startY + 285);

    ctx.fillStyle = "#000000";
    ctx.font = "32px 'Noto Sans JP', sans-serif";
    const birthStr = formatBirth(inputBirth.value);
    const ageStr = calculateAge(inputBirth.value);
    ctx.fillText(`${birthStr} ${ageStr}`, mX + 160, startY + 285);

    // 連絡先（電話・メール）枠 (高さ 130)
    ctx.fillStyle = "#333333";
    ctx.font = "24px 'Noto Sans JP', sans-serif";
    ctx.fillText("電話", mX + 16, startY + 365);
    ctx.fillText("E-mail", mX + 16, startY + 415);

    ctx.fillStyle = "#000000";
    ctx.font = "30px 'Noto Sans JP', sans-serif";
    ctx.fillText(inputTel.value || "", mX + 160, startY + 365);
    ctx.fillText(inputEmail.value || "", mX + 160, startY + 415);

    // 現住所ブロック (高さ 160)
    const addrY = startY + photoH + 20;
    const addrH = 160;
    ctx.strokeRect(mX, addrY, contentW, addrH);

    ctx.fillStyle = "#333333";
    ctx.font = "24px 'Noto Sans JP', sans-serif";
    ctx.fillText("現住所", mX + 16, addrY + 42);
    ctx.fillText(`〒 ${inputZip.value || ""}`, mX + 140, addrY + 42);

    ctx.fillStyle = "#000000";
    ctx.font = "34px 'Noto Sans JP', sans-serif";
    ctx.fillText(inputAddress.value || "", mX + 140, addrY + 110);

    // 学歴・職歴テーブル (高さ 980)
    const careerY = addrY + addrH + 20;
    const careerH = 980;
    drawTableSection(mX, careerY, contentW, careerH, "学　歴　・　職　歴", careers, 12);

    // 免許・資格テーブル (高さ 480)
    const licY = careerY + careerH + 20;
    const licH = 480;
    drawTableSection(mX, licY, contentW, licH, "免　許　・　資　格", licenses, 6);

    // 志望動機＆本人希望ブロック (高さ 620)
    const prY = licY + licH + 20;
    const prH = 620;
    ctx.strokeRect(mX, prY, contentW, prH);

    // 中間分割線
    const splitX = mX + contentW * 0.55;
    ctx.beginPath();
    ctx.moveTo(splitX, prY);
    ctx.lineTo(splitX, prY + prH);
    ctx.stroke();

    // 志望動機ヘッダー
    ctx.fillStyle = "#333333";
    ctx.font = "24px 'Noto Sans JP', sans-serif";
    ctx.fillText("志望の動機・特技・アピールポイントなど", mX + 16, prY + 40);

    // 志望動機テキスト
    ctx.fillStyle = "#000000";
    ctx.font = "28px 'Noto Sans JP', sans-serif";
    drawWrappedText(ctx, inputPr.value || "", mX + 16, prY + 90, splitX - mX - 32, 44);

    // 本人希望ヘッダー
    ctx.fillStyle = "#333333";
    ctx.font = "24px 'Noto Sans JP', sans-serif";
    ctx.fillText("本人希望記入欄（給与・職種・勤務時間等）", splitX + 16, prY + 40);

    // 本人希望テキスト
    ctx.fillStyle = "#000000";
    ctx.font = "28px 'Noto Sans JP', sans-serif";
    drawWrappedText(ctx, inputHope.value || "", splitX + 16, prY + 90, mX + contentW - splitX - 32, 44);
  }

  // 表セクションの描画ヘルパー
  function drawTableSection(x, y, w, h, title, items, rowCount) {
    ctx.strokeRect(x, y, w, h);

    const headerH = 60;
    ctx.beginPath();
    ctx.moveTo(x, y + headerH);
    ctx.lineTo(x + w, y + headerH);
    ctx.stroke();

    // 列分割線（年: 180, 月: 100, 内容: 残り）
    const yearW = 180;
    const monthW = 100;

    ctx.beginPath();
    ctx.moveTo(x + yearW, y);
    ctx.lineTo(x + yearW, y + h);
    ctx.moveTo(x + yearW + monthW, y);
    ctx.lineTo(x + yearW + monthW, y + h);
    ctx.stroke();

    // ヘッダー文字
    ctx.fillStyle = "#333333";
    ctx.font = "26px 'Noto Sans JP', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("年", x + yearW / 2, y + 42);
    ctx.fillText("月", x + yearW + monthW / 2, y + 42);
    ctx.fillText(title, x + yearW + monthW + (w - yearW - monthW) / 2, y + 42);

    // 各行
    const rowH = (h - headerH) / rowCount;
    for (let i = 0; i < rowCount; i++) {
      const curY = y + headerH + rowH * i;
      if (i > 0) {
        ctx.beginPath();
        ctx.moveTo(x, curY);
        ctx.lineTo(x + w, curY);
        ctx.stroke();
      }

      if (items[i]) {
        ctx.fillStyle = "#000000";
        ctx.font = "28px 'Noto Sans JP', sans-serif";

        // 年
        ctx.textAlign = "center";
        ctx.fillText(items[i].year || "", x + yearW / 2, curY + rowH / 2 + 10);

        // 月
        ctx.fillText(items[i].month || "", x + yearW + monthW / 2, curY + rowH / 2 + 10);

        // 内容
        ctx.textAlign = items[i].text === "以上" ? "right" : (items[i].text === "現在に至る" ? "left" : "left");
        const textX = items[i].text === "以上" ? x + w - 40 : x + yearW + monthW + 24;
        ctx.fillText(items[i].text || "", textX, curY + rowH / 2 + 10);
      }
    }
  }

  // 折り返しテキスト描画
  function drawWrappedText(context, text, x, y, maxWidth, lineHeight) {
    const lines = text.split("\n");
    let currentY = y;
    context.textAlign = "left";

    for (let i = 0; i < lines.length; i++) {
      let line = "";
      const chars = lines[i].split("");
      for (let n = 0; n < chars.length; n++) {
        const testLine = line + chars[n];
        const metrics = context.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          context.fillText(line, x, currentY);
          line = chars[n];
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      context.fillText(line, x, currentY);
      currentY += lineHeight;
    }
  }

  // 高解像度PNG保存
  btnDownloadPdf.addEventListener("click", () => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `履歴書_${inputName.value.trim() || "jis"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, "image/png");

    if (typeof window.gtag === "function") {
      window.gtag("event", "download_resume");
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

  // 初期化
  renderDynamicRows();
  if (document.fonts) {
    document.fonts.ready.then(renderResume);
  }
});
