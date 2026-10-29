// コンビニはがき名刺印刷ジェネレーター - インタラクティブUI Core Logic
(function () {
  "use strict";

  // 寸法定数 (mm)
  const HAGAKI_W_MM = 100.0;
  const HAGAKI_H_MM = 148.0;
  const CARD_W_MM = 91.0;
  const CARD_H_MM = 55.0;

  // 600 DPI 基準サイズ (px)
  const BASE_DPI = 600;
  const CARD_W = Math.round((CARD_W_MM / 25.4) * BASE_DPI); // 2150 px
  const CARD_H = Math.round((CARD_H_MM / 25.4) * BASE_DPI); // 1299 px
  const CARD_CENTER_X = CARD_W / 2; // 1075 px
  const CARD_CENTER_Y = CARD_H / 2; // 649.5 px

  // DOMキャンバス要素
  const previewCanvas = document.getElementById("preview-canvas");
  const previewCtx = previewCanvas.getContext("2d");
  const exportCanvas = document.getElementById("export-canvas");
  const exportCtx = exportCanvas.getContext("2d");
  const cardExportCanvas = document.getElementById("card-export-canvas");
  const cardExportCtx = cardExportCanvas.getContext("2d");
  const backCardExportCanvas = document.getElementById("back-card-export-canvas");
  const backCardExportCtx = backCardExportCanvas.getContext("2d");

  // モード管理
  let currentMainMode = "single"; // 'single' | 'double' | 'upload'
  let currentDoubleSide = "front"; // 'front' | 'back'
  let currentViewMode = "card"; // 'card' | 'hagaki'

  // メインモードタブ
  const mainTabBtns = document.querySelectorAll(".main-tab-btn");
  const modeSections = {
    single: document.getElementById("section-single"),
    double: document.getElementById("section-double"),
    upload: document.getElementById("section-upload"),
  };

  // ビュー切り替えタブ要素
  const tabViewCard = document.getElementById("tab-view-card");
  const tabViewHagaki = document.getElementById("tab-view-hagaki");
  const viewTabBtns = document.querySelectorAll(".view-tab-btn");
  const dragOverlayTip = document.getElementById("drag-overlay-tip");
  const canvasSizeInfo = document.getElementById("canvas-size-info");

  // アクションコンテナ
  const actionsSingle = document.getElementById("actions-single");
  const actionsDouble = document.getElementById("actions-double");

  // 両面名刺サブタブ要素
  const sideTabBtns = document.querySelectorAll(".side-tab-btn");
  const singleFrontSlot = document.getElementById("single-front-slot");
  const doubleFrontSlot = document.getElementById("double-front-slot");
  const frontFieldsContainer = document.getElementById("front-fields-container");
  const doubleBackFields = document.getElementById("double-back-fields");
  const inputBackHeading = document.getElementById("input-back-heading");
  const checkShowBackHeading = document.getElementById("check-show-back-heading");
  const inputBackText1 = document.getElementById("input-back-text1");
  const checkShowBackText1 = document.getElementById("check-show-back-text1");
  const inputBackText2 = document.getElementById("input-back-text2");
  const checkShowBackText2 = document.getElementById("check-show-back-text2");
  const inputBackText3 = document.getElementById("input-back-text3");
  const checkShowBackText3 = document.getElementById("check-show-back-text3");
  const inputBackText4 = document.getElementById("input-back-text4");
  const checkShowBackText4 = document.getElementById("check-show-back-text4");
  const inputBackQrUrl = document.getElementById("input-back-qr-url");
  const checkBackQr = document.getElementById("check-back-qr");
  const checkBackLine = document.getElementById("check-back-line");
  const checkBackBorder = document.getElementById("check-back-border");
  const backPresetBtns = document.querySelectorAll(".back-preset-btn");
  const backFontFamily = document.getElementById("back-font-family");
  const backThemeColor = document.getElementById("back-theme-color");
  const backColorHexLabel = document.getElementById("back-color-hex-label");
  const btnResetBackThemeColor = document.getElementById("btn-reset-back-theme-color");

  // フォーム要素（表面用）
  const inputName = document.getElementById("input-name");
  const inputKana = document.getElementById("input-kana");
  const inputCompany = document.getElementById("input-company");
  const inputTitle = document.getElementById("input-title");
  const inputTel = document.getElementById("input-tel");
  const inputEmail = document.getElementById("input-email");
  const inputUrl = document.getElementById("input-url");
  const inputAddress = document.getElementById("input-address");
  const checkQr = document.getElementById("check-qr");
  const checkLine = document.getElementById("check-line");
  const checkShowName = document.getElementById("check-show-name");
  const checkShowKana = document.getElementById("check-show-kana");
  const checkShowCompany = document.getElementById("check-show-company");
  const checkShowTitle = document.getElementById("check-show-title");
  const checkShowTel = document.getElementById("check-show-tel");
  const checkShowEmail = document.getElementById("check-show-email");
  const checkShowUrl = document.getElementById("check-show-url");
  const checkShowAddress = document.getElementById("check-show-address");
  const fontSelect = document.getElementById("font-family");
  const themeColorInput = document.getElementById("theme-color");
  const colorHexLabel = document.getElementById("color-hex-label");
  const btnResetThemeColor = document.getElementById("btn-reset-theme-color");
  const accentSwatches = document.querySelectorAll(".accent-swatch");
  const textColorBtns = document.querySelectorAll(".text-color-btn");
  let currentTextColorMode = "default"; // "default" | "black"
  const DEFAULT_THEME_COLOR = "#1e3a8a";

  const DEFAULT_TEXT_COLORS = {
    name: "#0f172a",
    kana: "#64748b",
    company: "#334155",
    title: "#64748b",
    tel: "#334155",
    email: "#334155",
    url: "#334155",
    address: "#334155",
  };
  const presetBtns = document.querySelectorAll(".preset-btn");

  // ツールバー要素
  const selectedNameLabel = document.getElementById("selected-element-name");
  const btnCenterElement = document.getElementById("btn-center-element");
  const btnVcenterElement = document.getElementById("btn-vcenter-element");
  const alignBtns = document.querySelectorAll(".align-btn");
  const weightBtns = document.querySelectorAll(".weight-btn");
  const toolbarItemAlign = document.getElementById("toolbar-item-align");
  const toolbarItemWeight = document.getElementById("toolbar-item-weight");
  const elementSizeSlider = document.getElementById("element-size-slider");
  const elementSizeLabel = document.getElementById("element-size-label");
  const elementEditorPanel = document.getElementById("element-editor-panel");
  const btnCloseElementEditor = document.getElementById("btn-close-element-editor");

  // 外部画像アップロード要素
  const uploadTypeRadios = document.querySelectorAll('input[name="upload_type"]');
  const labelFileTop = document.getElementById("label-file-top");
  const fileTop = document.getElementById("file-top");
  const previewImgTop = document.getElementById("preview-img-top");
  const dropZoneTop = document.getElementById("drop-zone-top");
  const dropMsgTop = document.getElementById("drop-msg-top");
  const uploadClearTopWrapper = document.getElementById("upload-clear-top-wrapper");
  const btnClearImgTop = document.getElementById("btn-clear-img-top");

  const groupBottomUpload = document.getElementById("group-bottom-upload");
  const fileBot = document.getElementById("file-bot");
  const previewImgBot = document.getElementById("preview-img-bot");
  const dropZoneBot = document.getElementById("drop-zone-bot");
  const dropMsgBot = document.getElementById("drop-msg-bot");
  const uploadClearBotWrapper = document.getElementById("upload-clear-bot-wrapper");
  const btnClearImgBot = document.getElementById("btn-clear-img-bot");

  let uploadedImgTop = null;
  let uploadedImgBot = null;

  // 画像の上に文字を乗せるパネル要素
  const checkOverlayText = document.getElementById("check-overlay-text");
  const overlayTextControls = document.getElementById("overlay-text-controls");
  const btnTextColors = document.querySelectorAll(".btn-text-color");
  const uploadThemeColor = document.getElementById("upload-theme-color");
  let currentTextColor = "#0f172a";

  // 画像重ね用入力フォーム要素
  const uploadInputName = document.getElementById("upload-input-name");
  const uploadInputKana = document.getElementById("upload-input-kana");
  const uploadInputCompany = document.getElementById("upload-input-company");
  const uploadInputTitle = document.getElementById("upload-input-title");
  const uploadInputTel = document.getElementById("upload-input-tel");
  const uploadInputEmail = document.getElementById("upload-input-email");
  const uploadInputUrl = document.getElementById("upload-input-url");
  const uploadInputAddress = document.getElementById("upload-input-address");

  // 画像重ね用トグルスイッチ
  const uploadCheckShowName = document.getElementById("upload-check-show-name");
  const uploadCheckShowKana = document.getElementById("upload-check-show-kana");
  const uploadCheckShowCompany = document.getElementById("upload-check-show-company");
  const uploadCheckShowTitle = document.getElementById("upload-check-show-title");
  const uploadCheckShowTel = document.getElementById("upload-check-show-tel");
  const uploadCheckShowEmail = document.getElementById("upload-check-show-email");
  const uploadCheckShowUrl = document.getElementById("upload-check-show-url");
  const uploadCheckShowAddress = document.getElementById("upload-check-show-address");
  const uploadCheckQr = document.getElementById("upload-check-qr");
  const uploadCheckLine = document.getElementById("upload-check-line");

  // 印刷オプション
  const optAvoidPostal = document.getElementById("opt-avoid-postal");
  const optRotate = document.getElementById("opt-rotate");
  const optRotateGroup = document.getElementById("opt-rotate-group");
  const optBorder = document.getElementById("opt-border");
  const optCropmarks = document.getElementById("opt-cropmarks");
  const optGap = document.getElementById("opt-gap");
  const optDpi = document.getElementById("opt-dpi");

  // アクションボタン
  const btnDownloadHagaki = document.getElementById("btn-download-hagaki");
  const btnDownloadFront = document.getElementById("btn-download-front");
  const btnDownloadBack = document.getElementById("btn-download-back");
  const btnDownloadCard = document.getElementById("btn-download-card");
  const btnShowGuide = document.getElementById("btn-show-guide");
  const btnHeaderGuide = document.getElementById("btn-header-guide");
  const linkFooterGuide = document.getElementById("link-footer-guide");
  const guideModal = document.getElementById("guide-modal");
  const modalClose = document.getElementById("modal-close");
  const modalClose2 = document.getElementById("modal-close-btn2");

  // プライバシーモーダル
  const btnPrivacyLink = document.getElementById("btn-privacy-link");
  const linkFooterPrivacy = document.getElementById("link-footer-privacy");
  const linkFooterDisclaimer = document.getElementById("link-footer-disclaimer");
  const privacyModal = document.getElementById("privacy-modal");
  const privacyModalClose = document.getElementById("privacy-modal-close");
  const privacyModalClose2 = document.getElementById("privacy-modal-close-btn2");

  // モバイル用ボトムバー＆画面固定・クイック編集要素
  const mBtnScrollPreview = document.getElementById("m-btn-scroll-preview");
  const mBtnDownload = document.getElementById("m-btn-download");
  const previewSection = document.getElementById("preview-section");
  const quickEditBar = document.getElementById("quick-edit-bar");
  const quickEditTag = document.getElementById("quick-edit-tag");
  const quickEditInput = document.getElementById("quick-edit-input");
  const btnJumpToInput = document.getElementById("btn-jump-to-input");
  const btnTogglePreviewSize = document.getElementById("btn-toggle-preview-size");
  const previewToggleIcon = document.getElementById("preview-toggle-icon");
  const previewToggleText = document.getElementById("preview-toggle-text");

  // プレビュー拡大縮小（ズーム）要素
  const btnZoomIn = document.getElementById("btn-zoom-in");
  const btnZoomOut = document.getElementById("btn-zoom-out");
  const btnZoomReset = document.getElementById("btn-zoom-reset");
  const btnZoomFit = document.getElementById("btn-zoom-fit");
  const previewContainer = document.getElementById("preview-container");
  const canvasWrapper = document.getElementById("canvas-wrapper");

  // ========================================================
  // 要素データモデル（表面用）
  // ========================================================
  const elements = {
    name: { id: "name", label: "氏名", x: 140, y: 520, align: "left", size: 94, weight: 700, bold: true, color: "#0f172a" },
    kana: { id: "kana", label: "ふりがな", x: 140, y: 400, align: "left", size: 26, weight: 500, bold: false, color: "#64748b" },
    company: { id: "company", label: "会社名", x: 140, y: 160, align: "left", size: 42, weight: 600, bold: true, color: "#334155" },
    title: { id: "title", label: "役職 / 肩書", x: 140, y: 230, align: "left", size: 32, weight: 500, bold: false, color: "#64748b" },
    tel: { id: "tel", label: "電話番号", x: 140, y: 860, align: "left", size: 28, weight: 400, bold: false, color: "#334155" },
    email: { id: "email", label: "メールアドレス", x: 140, y: 910, align: "left", size: 28, weight: 400, bold: false, color: "#334155" },
    url: { id: "url", label: "Web / SNS", x: 140, y: 960, align: "left", size: 28, weight: 400, bold: false, color: "#334155" },
    address: { id: "address", label: "住所", x: 140, y: 1010, align: "left", size: 28, weight: 400, bold: false, color: "#334155" },
    qr: { id: "qr", label: "QRコード", x: 1720, y: 880, size: 260 },
    line: { id: "line", label: "装飾ライン", x1: 140, y: 740, x2: CARD_W - 140, height: 4 },
  };

  // ========================================================
  // 要素データモデル（裏面用・完全ドラッグ対応！）
  // ========================================================
  const backElements = {
    heading: { id: "heading", label: "裏面タイトル", x: CARD_CENTER_X, y: 240, align: "center", size: 46, weight: 700, bold: true, color: "#1e3a8a" },
    text1: { id: "text1", label: "項目1", x: CARD_CENTER_X, y: 440, align: "center", size: 36, weight: 500, bold: false, color: "#334155" },
    text2: { id: "text2", label: "項目2", x: CARD_CENTER_X, y: 540, align: "center", size: 36, weight: 500, bold: false, color: "#334155" },
    text3: { id: "text3", label: "項目3", x: CARD_CENTER_X, y: 640, align: "center", size: 34, weight: 400, bold: false, color: "#64748b" },
    text4: { id: "text4", label: "項目4", x: CARD_CENTER_X, y: 730, align: "center", size: 30, weight: 400, bold: false, color: "#64748b" },
    qr: { id: "qr", label: "裏面QR", x: CARD_CENTER_X - 110, y: 860, size: 220 },
    line: { id: "line", label: "装飾ライン", x1: 400, y: 330, x2: CARD_W - 400, height: 4 },
  };

  // 選択・ドラッグ状態
  let selectedElementId = "name";
  let selectedContactField = "tel"; // 'tel' | 'email' | 'url' | 'address'
  let isDragging = false;
  let dragOffsetLogicalX = 0;
  let dragOffsetLogicalY = 0;
  let showSnapLineX = false;
  let showSnapLineY = false;

  const elementBBoxes = {};
  const backElementBBoxes = {};

  // 現在編集中の要素辞書を取得するヘルパー
  function getCurrentElementDict() {
    if (currentMainMode === "double" && currentDoubleSide === "back") {
      return backElements;
    }
    return elements;
  }

  function getCurrentBBoxDict() {
    if (currentMainMode === "double" && currentDoubleSide === "back") {
      return backElementBBoxes;
    }
    return elementBBoxes;
  }

  // ========================================================
  // アンドゥ（元に戻す Ctrl+Z） / リドゥ（やり直し Ctrl+Y）
  // ========================================================
  const undoStack = [];
  const redoStack = [];
  const MAX_UNDO_STACK = 50;
  let dragStartSnapshot = null;
  let arrowStartSnapshot = null;
  let arrowKeyTimeout = null;

  const btnUndo = document.getElementById("btn-undo");
  const btnRedo = document.getElementById("btn-redo");

  function updateUndoRedoButtons() {
    if (btnUndo) {
      const canUndo = undoStack.length > 0 || arrowStartSnapshot !== null;
      btnUndo.disabled = !canUndo;
      btnUndo.style.opacity = canUndo ? "1" : "0.45";
    }
    if (btnRedo) {
      btnRedo.disabled = redoStack.length === 0;
      btnRedo.style.opacity = redoStack.length === 0 ? "0.45" : "1";
    }
  }

  function getSnapshot() {
    return {
      elements: JSON.parse(JSON.stringify(elements)),
      backElements: JSON.parse(JSON.stringify(backElements)),
      selectedElementId: selectedElementId,
      currentDoubleSide: currentDoubleSide,
    };
  }

  function applySnapshot(snapshot) {
    if (!snapshot) return;
    for (const key of Object.keys(snapshot.elements)) {
      elements[key] = JSON.parse(JSON.stringify(snapshot.elements[key]));
    }
    for (const key of Object.keys(snapshot.backElements)) {
      backElements[key] = JSON.parse(JSON.stringify(snapshot.backElements[key]));
    }
    if (snapshot.currentDoubleSide && currentMainMode === "double" && snapshot.currentDoubleSide !== currentDoubleSide) {
      switchDoubleSide(snapshot.currentDoubleSide);
    }
    if (snapshot.selectedElementId) {
      selectElement(snapshot.selectedElementId);
    }
    updateToolbarForSelected();
    render();
  }

  function pushUndo(snapshot) {
    if (!snapshot) return;
    undoStack.push(snapshot);
    if (undoStack.length > MAX_UNDO_STACK) {
      undoStack.shift();
    }
    redoStack.length = 0;
    updateUndoRedoButtons();
  }

  function flushArrowSnapshot() {
    if (arrowStartSnapshot) {
      pushUndo(arrowStartSnapshot);
      arrowStartSnapshot = null;
      if (arrowKeyTimeout) {
        clearTimeout(arrowKeyTimeout);
        arrowKeyTimeout = null;
      }
    }
  }

  function undo() {
    flushArrowSnapshot();
    if (undoStack.length === 0) return;
    const currentState = getSnapshot();
    redoStack.push(currentState);
    const prevState = undoStack.pop();
    applySnapshot(prevState);
    updateUndoRedoButtons();
  }

  function redo() {
    flushArrowSnapshot();
    if (redoStack.length === 0) return;
    const currentState = getSnapshot();
    undoStack.push(currentState);
    const nextState = redoStack.pop();
    applySnapshot(nextState);
    updateUndoRedoButtons();
  }

  if (btnUndo) btnUndo.addEventListener("click", undo);
  if (btnRedo) btnRedo.addEventListener("click", redo);

  // ========================================================
  // メインモード切り替え
  // ========================================================
  function switchMainMode(mode) {
    currentMainMode = mode;

    mainTabBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-mode") === mode);
    });

    Object.keys(modeSections).forEach((key) => {
      modeSections[key].classList.toggle("active", key === mode);
    });

    if (mode === "single") {
      if (singleFrontSlot && frontFieldsContainer) {
        singleFrontSlot.appendChild(frontFieldsContainer);
        frontFieldsContainer.classList.remove("hidden");
      }
      actionsSingle.classList.remove("hidden");
      actionsDouble.classList.add("hidden");
      optRotateGroup.classList.remove("hidden");
      tabViewCard.classList.remove("hidden");
      setPreviewView(currentViewMode === "card" ? "card" : "hagaki");
      selectElement("name", false);
    } else if (mode === "double") {
      actionsSingle.classList.add("hidden");
      actionsDouble.classList.remove("hidden");
      optRotateGroup.classList.remove("hidden");
      tabViewCard.classList.remove("hidden");
      setPreviewView(currentViewMode === "card" ? "card" : "hagaki");
      if (currentDoubleSide === "front") {
        if (doubleFrontSlot && frontFieldsContainer) {
          doubleFrontSlot.appendChild(frontFieldsContainer);
          frontFieldsContainer.classList.remove("hidden");
        }
        if (doubleBackFields) doubleBackFields.classList.add("hidden");
        selectElement("name", false);
      } else {
        if (frontFieldsContainer) frontFieldsContainer.classList.add("hidden");
        if (doubleBackFields) doubleBackFields.classList.remove("hidden");
        selectElement("heading", false);
      }
    } else if (mode === "upload") {
      actionsSingle.classList.remove("hidden");
      actionsDouble.classList.add("hidden");
      optRotateGroup.classList.remove("hidden");
      tabViewCard.classList.remove("hidden");
      setPreviewView("card");
      selectElement("name", false);
    }

    render();
  }

  mainTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      switchMainMode(btn.getAttribute("data-mode"));
    });
  });

  // ========================================================
  // ビューモード設定 (card vs hagaki)
  // ========================================================
  function setPreviewView(view) {
    currentViewMode = view;

    viewTabBtns.forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-view") === view);
    });

    if (view === "card") {
      dragOverlayTip.classList.remove("hidden");
      canvasSizeInfo.textContent = "91 × 55 mm (名刺編集)";
    } else {
      dragOverlayTip.classList.add("hidden");
      canvasSizeInfo.textContent = "100 × 148 mm (はがき2面)";
      closeElementEditor();
    }
    zoomReset();
  }

  viewTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      setPreviewView(btn.getAttribute("data-view"));
      render();
    });
  });

  // ========================================================
  // プレビュー拡大縮小（ズーム）機能
  // ========================================================
  const ZOOM_STEPS = [0.4, 0.5, 0.65, 0.8, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0];
  let previewZoom = 1.0;
  let baseFitWidth = null;
  let baseFitHeight = null;

  function captureBaseFitSize() {
    const rect = previewCanvas.getBoundingClientRect();
    if (rect.width > 30 && rect.height > 30) {
      baseFitWidth = rect.width;
      baseFitHeight = rect.height;
    } else {
      const ar = currentViewMode === "card" ? (CARD_W_MM / CARD_H_MM) : (HAGAKI_W_MM / HAGAKI_H_MM);
      const cw = Math.max(200, (previewContainer.clientWidth || 360) - 20);
      const ch = Math.max(120, (previewContainer.clientHeight || 140) - 20);
      baseFitWidth = Math.min(cw, ch * ar);
      baseFitHeight = baseFitWidth / ar;
    }
  }

  function applyZoom(newZoom) {
    const minZoom = ZOOM_STEPS[0];
    const maxZoom = ZOOM_STEPS[ZOOM_STEPS.length - 1];
    previewZoom = Math.max(minZoom, Math.min(maxZoom, Math.round(newZoom * 100) / 100));

    if (btnZoomReset) {
      btnZoomReset.textContent = `${Math.round(previewZoom * 100)}%`;
    }

    if (Math.abs(previewZoom - 1.0) < 0.01) {
      // 100% Fit: 完全レスポンシブ
      previewCanvas.style.width = "";
      previewCanvas.style.height = "";
      previewCanvas.style.maxWidth = "";
      previewCanvas.style.maxHeight = "";
      if (canvasWrapper) {
        canvasWrapper.style.width = "";
        canvasWrapper.style.height = "";
        canvasWrapper.style.maxWidth = "";
      }
      return;
    }

    if (!baseFitWidth || !baseFitHeight) {
      captureBaseFitSize();
    }

    const targetW = Math.round(baseFitWidth * previewZoom);
    const targetH = Math.round(baseFitHeight * previewZoom);

    previewCanvas.style.maxWidth = "none";
    previewCanvas.style.maxHeight = "none";
    previewCanvas.style.width = `${targetW}px`;
    previewCanvas.style.height = `${targetH}px`;

    if (canvasWrapper) {
      canvasWrapper.style.maxWidth = "none";
      canvasWrapper.style.width = `${targetW}px`;
      canvasWrapper.style.height = `${targetH}px`;
    }

    if (previewContainer) {
      requestAnimationFrame(() => {
        const overflowX = previewContainer.scrollWidth - previewContainer.clientWidth;
        const overflowY = previewContainer.scrollHeight - previewContainer.clientHeight;
        if (overflowX > 0 && previewContainer.scrollLeft === 0) {
          previewContainer.scrollLeft = Math.round(overflowX / 2);
        }
        if (overflowY > 0 && previewContainer.scrollTop === 0) {
          previewContainer.scrollTop = Math.round(overflowY / 2);
        }
      });
    }
  }

  function zoomIn() {
    if (Math.abs(previewZoom - 1.0) < 0.01) {
      captureBaseFitSize();
    }
    const next = ZOOM_STEPS.find((s) => s > previewZoom + 0.03);
    if (next) {
      applyZoom(next);
    } else {
      applyZoom(previewZoom + 0.25);
    }
  }

  function zoomOut() {
    if (Math.abs(previewZoom - 1.0) < 0.01) {
      captureBaseFitSize();
    }
    const prev = [...ZOOM_STEPS].reverse().find((s) => s < previewZoom - 0.03);
    if (prev) {
      applyZoom(prev);
    } else {
      applyZoom(previewZoom - 0.25);
    }
  }

  function zoomReset() {
    baseFitWidth = null;
    baseFitHeight = null;
    applyZoom(1.0);
    if (previewContainer) {
      previewContainer.scrollLeft = 0;
      previewContainer.scrollTop = 0;
    }
  }

  if (btnZoomIn) btnZoomIn.addEventListener("click", zoomIn);
  if (btnZoomOut) btnZoomOut.addEventListener("click", zoomOut);
  if (btnZoomReset) btnZoomReset.addEventListener("click", zoomReset);
  if (btnZoomFit) btnZoomFit.addEventListener("click", zoomReset);

  // マウスホイールでのズーム (Ctrl + ホイール または トラックパッドのピンチ操作)
  if (previewContainer) {
    previewContainer.addEventListener("wheel", (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          zoomIn();
        } else {
          zoomOut();
        }
      }
    }, { passive: false });
  }

  // スマホ・タブレット用ピンチズーム
  let touchPinchStartDist = 0;
  let touchPinchStartZoom = 1.0;

  if (previewContainer) {
    previewContainer.addEventListener("touchstart", (e) => {
      if (e.touches && e.touches.length >= 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        touchPinchStartDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        touchPinchStartZoom = previewZoom;
        if (Math.abs(previewZoom - 1.0) < 0.01) {
          captureBaseFitSize();
        }
      }
    }, { passive: false });

    previewContainer.addEventListener("touchmove", (e) => {
      if (e.touches && e.touches.length >= 2 && touchPinchStartDist > 10) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const scale = dist / touchPinchStartDist;
        applyZoom(touchPinchStartZoom * scale);
      }
    }, { passive: false });
  }

  window.addEventListener("resize", () => {
    if (Math.abs(previewZoom - 1.0) < 0.01) {
      baseFitWidth = null;
      baseFitHeight = null;
    }
  });

  // ========================================================
  // 両面名刺用：表面/裏面 サブタブ切り替え
  // ========================================================
  function switchDoubleSide(side) {
    sideTabBtns.forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-side") === side);
    });
    currentDoubleSide = side;

    if (currentDoubleSide === "front") {
      if (doubleFrontSlot && frontFieldsContainer) {
        doubleFrontSlot.appendChild(frontFieldsContainer);
        frontFieldsContainer.classList.remove("hidden");
      }
      if (doubleBackFields) doubleBackFields.classList.add("hidden");
      selectElement("name", false);
    } else {
      if (frontFieldsContainer) frontFieldsContainer.classList.add("hidden");
      if (doubleBackFields) doubleBackFields.classList.remove("hidden");
      selectElement("heading", false);
    }
    render();
  }

  sideTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      switchDoubleSide(btn.getAttribute("data-side"));
    });
  });

  // 外部画像：表面のみ / 両面ラジオ切り替え
  uploadTypeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      const isDouble = radio.value === "double";
      groupBottomUpload.classList.toggle("hidden", !isDouble);
      labelFileTop.textContent = isDouble ? "名刺画像ファイル（表面）" : "名刺画像ファイル（表面 / 背景）";
      render();
    });
  });

  // 画像上の文字重ねトグル
  checkOverlayText.addEventListener("change", () => {
    overlayTextControls.classList.toggle("hidden", !checkOverlayText.checked);
    render();
  });

  // 文字色ボタン
  btnTextColors.forEach((b) => {
    b.addEventListener("click", () => {
      btnTextColors.forEach((btn) => btn.classList.remove("active"));
      b.classList.add("active");
      currentTextColor = b.getAttribute("data-color");

      elements.name.color = currentTextColor;
      elements.kana.color = currentTextColor === "#ffffff" ? "#cbd5e1" : "#64748b";
      elements.company.color = currentTextColor === "#ffffff" ? "#f1f5f9" : "#334155";
      elements.title.color = currentTextColor === "#ffffff" ? "#cbd5e1" : "#64748b";
      const contactColor = currentTextColor === "#ffffff" ? "#f1f5f9" : "#334155";
      elements.tel.color = contactColor;
      elements.email.color = contactColor;
      elements.url.color = contactColor;
      elements.address.color = contactColor;
      render();
    });
  });

  // アクセント色（テーマカラー）設定と同期
  function setAccentColor(color) {
    themeColorInput.value = color;
    colorHexLabel.textContent = color;
    if (backThemeColor) backThemeColor.value = color;
    if (backColorHexLabel) backColorHexLabel.textContent = color;
    uploadThemeColor.value = color;
    backElements.heading.color = color;
    if (backElements.line) backElements.line.color = color;
    document.querySelectorAll(".accent-swatch").forEach((sw) => {
      sw.classList.toggle("active", sw.getAttribute("data-color").toLowerCase() === color.toLowerCase());
    });
    render();
  }

  document.querySelectorAll(".accent-swatch").forEach((sw) => {
    sw.addEventListener("click", () => {
      setAccentColor(sw.getAttribute("data-color"));
    });
  });

  if (btnResetThemeColor) {
    btnResetThemeColor.addEventListener("click", () => {
      setAccentColor(DEFAULT_THEME_COLOR);
    });
  }
  if (btnResetBackThemeColor) {
    btnResetBackThemeColor.addEventListener("click", () => {
      setAccentColor(DEFAULT_THEME_COLOR);
    });
  }

  themeColorInput.addEventListener("input", () => {
    setAccentColor(themeColorInput.value);
  });
  if (backThemeColor) {
    backThemeColor.addEventListener("input", () => {
      setAccentColor(backThemeColor.value);
    });
  }

  uploadThemeColor.addEventListener("input", () => {
    setAccentColor(uploadThemeColor.value);
  });

  // フォント同期（表面・裏面）
  if (backFontFamily) {
    backFontFamily.addEventListener("change", () => {
      fontSelect.value = backFontFamily.value;
      render();
    });
    fontSelect.addEventListener("change", () => {
      backFontFamily.value = fontSelect.value;
      render();
    });
  }

  // 文字色モード（デフォルト / 真っ黒 #000000）
  function applyTextColorMode(mode) {
    currentTextColorMode = mode;
    document.querySelectorAll(".text-color-btn, .back-text-color-btn").forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-color-mode") === mode);
    });

    if (mode === "black") {
      ["name", "kana", "company", "title", "tel", "email", "url", "address"].forEach((k) => {
        elements[k].color = "#000000";
      });
      backElements.text1.color = "#000000";
      backElements.text2.color = "#000000";
      backElements.text3.color = "#000000";
      if (backElements.text4) backElements.text4.color = "#000000";
    } else {
      Object.entries(DEFAULT_TEXT_COLORS).forEach(([k, c]) => {
        elements[k].color = c;
      });
      backElements.heading.color = themeColorInput.value;
      backElements.text1.color = "#334155";
      backElements.text2.color = "#334155";
      backElements.text3.color = "#64748b";
      if (backElements.text4) backElements.text4.color = "#64748b";
    }
    render();
  }

  document.querySelectorAll(".text-color-btn, .back-text-color-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyTextColorMode(btn.getAttribute("data-color-mode"));
    });
  });

  // ========================================================
  // 表面プリセット適用
  // ========================================================
  function applyPreset(presetName) {
    flushArrowSnapshot();
    pushUndo(getSnapshot());
    if (presetName === "center") {
      elements.name.x = CARD_CENTER_X;
      elements.name.y = 640;
      elements.name.align = "center";
      elements.name.size = 100;

      elements.kana.x = CARD_CENTER_X;
      elements.kana.y = 535;
      elements.kana.align = "center";
      elements.kana.size = 28;

      elements.company.x = CARD_CENTER_X;
      elements.company.y = 250;
      elements.company.align = "center";
      elements.company.size = 44;

      elements.title.x = CARD_CENTER_X;
      elements.title.y = 330;
      elements.title.align = "center";
      elements.title.size = 32;

      elements.tel.x = CARD_CENTER_X;
      elements.tel.y = 880;
      elements.tel.align = "center";
      elements.tel.size = 28;

      elements.email.x = CARD_CENTER_X;
      elements.email.y = 935;
      elements.email.align = "center";
      elements.email.size = 28;

      elements.url.x = CARD_CENTER_X;
      elements.url.y = 990;
      elements.url.align = "center";
      elements.url.size = 28;

      elements.address.x = CARD_CENTER_X;
      elements.address.y = 1045;
      elements.address.align = "center";
      elements.address.size = 28;

      elements.qr.x = 1750;
      elements.qr.y = 920;
      elements.qr.size = 230;

      elements.line.x1 = 450;
      elements.line.x2 = CARD_W - 450;
      elements.line.y = 745;
    } else if (presetName === "left") {
      elements.company.x = 140;
      elements.company.y = 160;
      elements.company.align = "left";
      elements.company.size = 42;

      elements.title.x = 140;
      elements.title.y = 230;
      elements.title.align = "left";
      elements.title.size = 32;

      elements.kana.x = 140;
      elements.kana.y = 400;
      elements.kana.align = "left";
      elements.kana.size = 26;

      elements.name.x = 140;
      elements.name.y = 520;
      elements.name.align = "left";
      elements.name.size = 94;

      elements.tel.x = 140;
      elements.tel.y = 860;
      elements.tel.align = "left";
      elements.tel.size = 28;

      elements.email.x = 140;
      elements.email.y = 910;
      elements.email.align = "left";
      elements.email.size = 28;

      elements.url.x = 140;
      elements.url.y = 960;
      elements.url.align = "left";
      elements.url.size = 28;

      elements.address.x = 140;
      elements.address.y = 1010;
      elements.address.align = "left";
      elements.address.size = 28;

      elements.qr.x = 1720;
      elements.qr.y = 880;
      elements.qr.size = 260;

      elements.line.x1 = 140;
      elements.line.x2 = CARD_W - 140;
      elements.line.y = 620;
    } else if (presetName === "split") {
      elements.company.x = 140;
      elements.company.y = 280;
      elements.company.align = "left";
      elements.company.size = 42;

      elements.title.x = 140;
      elements.title.y = 360;
      elements.title.align = "left";
      elements.title.size = 32;

      elements.kana.x = 140;
      elements.kana.y = 500;
      elements.kana.align = "left";
      elements.kana.size = 26;

      elements.name.x = 140;
      elements.name.y = 620;
      elements.name.align = "left";
      elements.name.size = 88;

      elements.tel.x = 1180;
      elements.tel.y = 380;
      elements.tel.align = "left";
      elements.tel.size = 28;

      elements.email.x = 1180;
      elements.email.y = 430;
      elements.email.align = "left";
      elements.email.size = 28;

      elements.url.x = 1180;
      elements.url.y = 480;
      elements.url.align = "left";
      elements.url.size = 28;

      elements.address.x = 1180;
      elements.address.y = 530;
      elements.address.align = "left";
      elements.address.size = 28;

      elements.qr.x = 1700;
      elements.qr.y = 880;
      elements.qr.size = 250;

      elements.line.x1 = 140;
      elements.line.x2 = 1000;
      elements.line.y = 710;
    } else if (presetName === "minimal") {
      elements.name.x = CARD_CENTER_X;
      elements.name.y = 600;
      elements.name.align = "center";
      elements.name.size = 84;

      elements.kana.x = CARD_CENTER_X;
      elements.kana.y = 520;
      elements.kana.align = "center";
      elements.kana.size = 24;

      elements.company.x = CARD_CENTER_X;
      elements.company.y = 700;
      elements.company.align = "center";
      elements.company.size = 32;

      elements.title.x = CARD_CENTER_X;
      elements.title.y = 750;
      elements.title.align = "center";
      elements.title.size = 28;

      elements.tel.x = CARD_CENTER_X;
      elements.tel.y = 960;
      elements.tel.align = "center";
      elements.tel.size = 26;

      elements.email.x = CARD_CENTER_X;
      elements.email.y = 1010;
      elements.email.align = "center";
      elements.email.size = 26;

      elements.url.x = CARD_CENTER_X;
      elements.url.y = 1060;
      elements.url.align = "center";
      elements.url.size = 26;

      elements.address.x = CARD_CENTER_X;
      elements.address.y = 1110;
      elements.address.align = "center";
      elements.address.size = 26;

      elements.qr.x = 1750;
      elements.qr.y = 920;
      elements.qr.size = 220;

      elements.line.x1 = 800;
      elements.line.x2 = CARD_W - 800;
      elements.line.y = 830;
    }

    updateToolbarForSelected();
    render();
  }

  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      presetBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      applyPreset(btn.getAttribute("data-preset"));
    });
  });

  // ========================================================
  // 裏面プリセット適用（裏面レイアウト）
  // ========================================================
  function applyBackPreset(presetName) {
    flushArrowSnapshot();
    pushUndo(getSnapshot());
    if (presetName === "business") {
      inputBackHeading.value = "BUSINESS / 事業内容";
      inputBackText1.value = "・Webシステム・アプリ開発";
      inputBackText2.value = "・UI/UXデザイン・各種制作";
      inputBackText3.value = "・ITコンサルティング・保守サポート";
      if (inputBackText4) inputBackText4.value = "お気軽にお問い合わせください。";
      if (checkShowBackHeading) checkShowBackHeading.checked = true;
      if (checkShowBackText1) checkShowBackText1.checked = true;
      if (checkShowBackText2) checkShowBackText2.checked = true;
      if (checkShowBackText3) checkShowBackText3.checked = true;
      if (checkShowBackText4) checkShowBackText4.checked = true;
      if (checkBackLine) checkBackLine.checked = true;
      checkBackQr.checked = true;
      checkBackBorder.checked = true;

      backElements.heading.x = CARD_CENTER_X;
      backElements.heading.y = 240;
      backElements.heading.align = "center";
      backElements.heading.size = 46;

      backElements.line.x1 = 400;
      backElements.line.x2 = CARD_W - 400;
      backElements.line.y = 330;

      backElements.text1.x = CARD_CENTER_X;
      backElements.text1.y = 440;
      backElements.text1.align = "center";
      backElements.text1.size = 36;

      backElements.text2.x = CARD_CENTER_X;
      backElements.text2.y = 540;
      backElements.text2.align = "center";
      backElements.text2.size = 36;

      backElements.text3.x = CARD_CENTER_X;
      backElements.text3.y = 640;
      backElements.text3.align = "center";
      backElements.text3.size = 34;

      backElements.text4.x = CARD_CENTER_X;
      backElements.text4.y = 730;
      backElements.text4.align = "center";
      backElements.text4.size = 30;

      backElements.qr.x = CARD_CENTER_X - 110;
      backElements.qr.y = 860;
      backElements.qr.size = 220;
    } else if (presetName === "english") {
      inputBackHeading.value = "SAMPLE CORPORATION";
      inputBackText1.value = "TARO YAMADA / President & CEO";
      inputBackText2.value = "Tokyo, Japan | info@example.com";
      inputBackText3.value = "https://example.com";
      if (inputBackText4) inputBackText4.value = "TEL: +81-90-1234-5678";
      if (checkShowBackHeading) checkShowBackHeading.checked = true;
      if (checkShowBackText1) checkShowBackText1.checked = true;
      if (checkShowBackText2) checkShowBackText2.checked = true;
      if (checkShowBackText3) checkShowBackText3.checked = true;
      if (checkShowBackText4) checkShowBackText4.checked = true;
      if (checkBackLine) checkBackLine.checked = true;
      checkBackQr.checked = false;
      checkBackBorder.checked = true;

      backElements.heading.x = CARD_CENTER_X;
      backElements.heading.y = 300;
      backElements.heading.align = "center";
      backElements.heading.size = 48;

      backElements.line.x1 = 500;
      backElements.line.x2 = CARD_W - 500;
      backElements.line.y = 390;

      backElements.text1.x = CARD_CENTER_X;
      backElements.text1.y = 490;
      backElements.text1.align = "center";
      backElements.text1.size = 38;

      backElements.text2.x = CARD_CENTER_X;
      backElements.text2.y = 590;
      backElements.text2.align = "center";
      backElements.text2.size = 34;

      backElements.text3.x = CARD_CENTER_X;
      backElements.text3.y = 680;
      backElements.text3.align = "center";
      backElements.text3.size = 32;

      backElements.text4.x = CARD_CENTER_X;
      backElements.text4.y = 760;
      backElements.text4.align = "center";
      backElements.text4.size = 30;
    } else if (presetName === "sns_qr") {
      inputBackHeading.value = "CONNECT WITH ME";
      inputBackText1.value = "公式Webサイト・各種SNSはこちら";
      inputBackText2.value = "QRコードから直接アクセスできます";
      inputBackText3.value = "お気軽にお問い合わせください";
      if (inputBackText4) inputBackText4.value = "";
      if (checkShowBackHeading) checkShowBackHeading.checked = true;
      if (checkShowBackText1) checkShowBackText1.checked = true;
      if (checkShowBackText2) checkShowBackText2.checked = true;
      if (checkShowBackText3) checkShowBackText3.checked = true;
      if (checkShowBackText4) checkShowBackText4.checked = false;
      if (checkBackLine) checkBackLine.checked = false;
      checkBackQr.checked = true;
      checkBackBorder.checked = true;

      backElements.heading.x = CARD_CENTER_X;
      backElements.heading.y = 230;
      backElements.heading.align = "center";
      backElements.heading.size = 48;

      backElements.text1.x = CARD_CENTER_X;
      backElements.text1.y = 340;
      backElements.text1.align = "center";
      backElements.text1.size = 34;

      backElements.text2.x = CARD_CENTER_X;
      backElements.text2.y = 420;
      backElements.text2.align = "center";
      backElements.text2.size = 32;

      backElements.text3.x = CARD_CENTER_X;
      backElements.text3.y = 490;
      backElements.text3.align = "center";
      backElements.text3.size = 30;

      backElements.qr.x = CARD_CENTER_X - 160;
      backElements.qr.y = 580;
      backElements.qr.size = 320; // 大型QR
    } else if (presetName === "minimal_back") {
      inputBackHeading.value = "THANK YOU";
      inputBackText1.value = "出会いに感謝いたします。";
      inputBackText2.value = "";
      inputBackText3.value = "";
      if (inputBackText4) inputBackText4.value = "";
      if (checkShowBackHeading) checkShowBackHeading.checked = true;
      if (checkShowBackText1) checkShowBackText1.checked = true;
      if (checkShowBackText2) checkShowBackText2.checked = false;
      if (checkShowBackText3) checkShowBackText3.checked = false;
      if (checkShowBackText4) checkShowBackText4.checked = false;
      if (checkBackLine) checkBackLine.checked = false;
      checkBackQr.checked = false;
      checkBackBorder.checked = false;

      backElements.heading.x = CARD_CENTER_X;
      backElements.heading.y = 560;
      backElements.heading.align = "center";
      backElements.heading.size = 52;

      backElements.text1.x = CARD_CENTER_X;
      backElements.text1.y = 680;
      backElements.text1.align = "center";
      backElements.text1.size = 34;
    }

    if (typeof updateAllBackVisualDisabled === "function") {
      updateAllBackVisualDisabled();
    }
    updateToolbarForSelected();
    render();
  }

  backPresetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      backPresetBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      applyBackPreset(btn.getAttribute("data-preset"));
    });
  });

  // ========================================================
  // ツールバー＆クイック編集（表面・裏面 両対応）
  // ========================================================
  function getActiveContactList() {
    const list = [];
    const isTelOn = !checkShowTel || checkShowTel.checked;
    const isEmailOn = !checkShowEmail || checkShowEmail.checked;
    const isUrlOn = !checkShowUrl || checkShowUrl.checked;
    const isAddressOn = !checkShowAddress || checkShowAddress.checked;

    if (isTelOn && inputTel && inputTel.value.trim()) {
      list.push({ type: "tel", label: "電話番号", input: (currentMainMode === "upload" ? uploadInputTel : inputTel), text: `TEL: ${inputTel.value.trim()}` });
    }
    if (isEmailOn && inputEmail && inputEmail.value.trim()) {
      list.push({ type: "email", label: "メールアドレス", input: (currentMainMode === "upload" ? uploadInputEmail : inputEmail), text: `Mail: ${inputEmail.value.trim()}` });
    }
    if (isUrlOn && inputUrl && inputUrl.value.trim()) {
      list.push({ type: "url", label: "Web / SNS", input: (currentMainMode === "upload" ? uploadInputUrl : inputUrl), text: `Web: ${inputUrl.value.trim()}` });
    }
    if (isAddressOn && inputAddress && inputAddress.value.trim()) {
      list.push({ type: "address", label: "住所", input: (currentMainMode === "upload" ? uploadInputAddress : inputAddress), text: `Add: ${inputAddress.value.trim()}` });
    }
    return list;
  }

  function getTargetInputForElement(id) {
    const isUpload = currentMainMode === "upload";
    if (currentMainMode === "double" && currentDoubleSide === "back") {
      switch (id) {
        case "heading": return inputBackHeading;
        case "text1": return inputBackText1;
        case "text2": return inputBackText2;
        case "text3": return inputBackText3;
        case "text4": return inputBackText4;
        case "qr": return inputBackQrUrl;
        case "line": return checkBackLine;
        default: return null;
      }
    } else {
      switch (id) {
        case "name": return isUpload ? uploadInputName : inputName;
        case "kana": return isUpload ? uploadInputKana : inputKana;
        case "company": return isUpload ? uploadInputCompany : inputCompany;
        case "title": return isUpload ? uploadInputTitle : inputTitle;
        case "tel": return isUpload ? uploadInputTel : inputTel;
        case "email": return isUpload ? uploadInputEmail : inputEmail;
        case "url": return isUpload ? uploadInputUrl : inputUrl;
        case "address": return isUpload ? uploadInputAddress : inputAddress;
        case "qr": return isUpload ? uploadInputUrl : inputUrl;
        case "line": return isUpload ? uploadCheckLine : checkLine;
        default: return null;
      }
    }
  }

  function openElementEditor() {
    if (elementEditorPanel) {
      elementEditorPanel.classList.add("open");
    }
  }

  function closeElementEditor() {
    if (elementEditorPanel) {
      elementEditorPanel.classList.remove("open");
    }
  }

  function deselectElement() {
    selectedElementId = null;
    if (quickEditInput) {
      quickEditInput.value = "";
      quickEditInput.placeholder = "文字枠をタップすると編集できます";
    }
    if (quickEditTag) {
      quickEditTag.textContent = "未選択";
    }
    if (selectedNameLabel) {
      selectedNameLabel.textContent = "未選択";
    }
    if (btnJumpToInput) {
      btnJumpToInput.style.display = "none";
    }
    closeElementEditor();
    render();
  }

  if (btnCloseElementEditor) {
    btnCloseElementEditor.addEventListener("click", (e) => {
      e.stopPropagation();
      deselectElement();
    });
  }

  function selectElement(id, autoOpenEditor = true) {
    const elDict = getCurrentElementDict();
    if (!elDict[id]) return;
    selectedElementId = id;

    let displayLabel = elDict[id].label;
    if (id === "line") {
      displayLabel = "装飾ライン";
    }

    selectedNameLabel.textContent = displayLabel;
    updateToolbarForSelected();

    // クイック編集バーの同期（フォーカスは勝手に奪わない）
    if (quickEditBar && quickEditTag && quickEditInput) {
      quickEditTag.textContent = displayLabel;
      const targetInput = getTargetInputForElement(id);
      if (targetInput) {
        if (id === "line") {
          quickEditInput.disabled = true;
          const currentCheck = (currentMainMode === "double" && currentDoubleSide === "back") ? checkBackLine : (isUpload ? uploadCheckLine : checkLine);
          quickEditInput.value = currentCheck && currentCheck.checked ? "装飾ライン（表示中）" : "装飾ライン（非表示）";
        } else {
          quickEditInput.disabled = false;
          quickEditInput.value = targetInput.value;
          quickEditInput.placeholder = `${displayLabel}の文字を入力...`;
        }

        // ★ 連絡先も含め、全ての要素で「フォームへ」ボタンを表示
        if (btnJumpToInput) btnJumpToInput.style.display = "inline-flex";
      } else {
        quickEditInput.disabled = true;
        quickEditInput.value = "";
        if (btnJumpToInput) btnJumpToInput.style.display = "none";
      }
    }

    if (autoOpenEditor) {
      openElementEditor();
    }

    render();
  }

  // クイック編集入力の同期
  if (quickEditInput) {
    quickEditInput.addEventListener("input", () => {
      const targetInput = getTargetInputForElement(selectedElementId);
      if (targetInput && targetInput.type !== "checkbox") {
        targetInput.value = quickEditInput.value;
        render();
      }
    });
  }

  // 左の入力フォーム該当位置へスムーズ移動＆発光
  if (btnJumpToInput) {
    btnJumpToInput.addEventListener("click", () => {
      const targetInput = getTargetInputForElement(selectedElementId);
      if (targetInput) {
        targetInput.scrollIntoView({ behavior: "smooth", block: "center" });
        targetInput.focus();
        const highlightTarget = targetInput.type === "checkbox" ? (targetInput.parentElement || targetInput) : targetInput;
        highlightTarget.classList.add("input-pulse-highlight");
        setTimeout(() => highlightTarget.classList.remove("input-pulse-highlight"), 1400);
      }
    });
  }

  // スマホ用：プレビュー折りたたみ・展開トグル
  if (btnTogglePreviewSize && previewSection) {
    btnTogglePreviewSize.addEventListener("click", () => {
      const isCollapsed = previewSection.classList.toggle("preview-collapsed");
      if (previewToggleIcon) previewToggleIcon.textContent = isCollapsed ? "🔽" : "🔼";
      if (previewToggleText) previewToggleText.textContent = isCollapsed ? "展開" : "折りたたむ";
    });
  }

  function updateToolbarForSelected() {
    const elDict = getCurrentElementDict();
    const el = elDict[selectedElementId];
    if (!el) return;

    selectedNameLabel.textContent = el.label;

    if (el.align) {
      if (toolbarItemAlign) toolbarItemAlign.style.display = "flex";
      alignBtns.forEach((b) => {
        b.classList.toggle("active", b.getAttribute("data-align") === el.align);
      });
    } else {
      if (toolbarItemAlign) toolbarItemAlign.style.display = "none";
    }

    if (el.weight) {
      if (toolbarItemWeight) toolbarItemWeight.style.display = "flex";
      weightBtns.forEach((b) => {
        b.classList.toggle("active", parseInt(b.getAttribute("data-weight"), 10) === el.weight);
      });
    } else {
      if (toolbarItemWeight) toolbarItemWeight.style.display = "none";
    }

    if (el.size) {
      elementSizeSlider.value = el.size;
      elementSizeLabel.textContent = `${el.size}px`;
      elementSizeSlider.parentElement.style.display = "flex";
    } else {
      elementSizeSlider.parentElement.style.display = "none";
    }
  }

  btnCenterElement.addEventListener("click", () => {
    flushArrowSnapshot();
    const elDict = getCurrentElementDict();
    const el = elDict[selectedElementId];
    if (el) {
      pushUndo(getSnapshot());
      if (selectedElementId === "line") {
        const lineLen = el.x2 - el.x1;
        el.x1 = CARD_CENTER_X - lineLen / 2;
        el.x2 = CARD_CENTER_X + lineLen / 2;
      } else if (selectedElementId === "qr" && el.size) {
        el.x = CARD_CENTER_X - el.size / 2;
      } else {
        el.x = CARD_CENTER_X;
        if (el.align) el.align = "center";
      }
      updateToolbarForSelected();
      render();
    }
  });

  btnVcenterElement.addEventListener("click", () => {
    flushArrowSnapshot();
    const elDict = getCurrentElementDict();
    const el = elDict[selectedElementId];
    if (el) {
      pushUndo(getSnapshot());
      if (selectedElementId === "qr" && el.size) {
        el.y = CARD_CENTER_Y - el.size / 2;
      } else {
        el.y = CARD_CENTER_Y;
      }
      render();
    }
  });

  alignBtns.forEach((b) => {
    b.addEventListener("click", () => {
      const align = b.getAttribute("data-align");
      const elDict = getCurrentElementDict();
      const el = elDict[selectedElementId];
      if (el && el.align && el.align !== align) {
        flushArrowSnapshot();
        pushUndo(getSnapshot());
        el.align = align;
        alignBtns.forEach((btn) => btn.classList.remove("active"));
        b.classList.add("active");
        render();
      }
    });
  });

  weightBtns.forEach((b) => {
    b.addEventListener("click", () => {
      const weight = parseInt(b.getAttribute("data-weight"), 10);
      const elDict = getCurrentElementDict();
      const el = elDict[selectedElementId];
      if (el && el.weight && el.weight !== weight) {
        flushArrowSnapshot();
        pushUndo(getSnapshot());
        el.weight = weight;
        weightBtns.forEach((btn) => btn.classList.remove("active"));
        b.classList.add("active");
        render();
      }
    });
  });

  let sliderStartSnapshot = null;
  elementSizeSlider.addEventListener("pointerdown", () => {
    flushArrowSnapshot();
    if (!sliderStartSnapshot) sliderStartSnapshot = getSnapshot();
  });
  elementSizeSlider.addEventListener("change", () => {
    if (sliderStartSnapshot) {
      pushUndo(sliderStartSnapshot);
      sliderStartSnapshot = null;
    }
  });

  elementSizeSlider.addEventListener("input", () => {
    const elDict = getCurrentElementDict();
    const el = elDict[selectedElementId];
    if (el && el.size) {
      el.size = parseInt(elementSizeSlider.value, 10);
      elementSizeLabel.textContent = `${el.size}px`;
      render();
    }
  });

  themeColorInput.addEventListener("input", () => {
    colorHexLabel.textContent = themeColorInput.value;
    uploadThemeColor.value = themeColorInput.value;
    backElements.heading.color = themeColorInput.value;
    render();
  });

  // ========================================================
  // 画像アップロード処理
  // ========================================================
  function setupFileUpload(dropZone, fileInput, previewImg, dropMsg, clearWrapper, isTop) {
    function handleFile(file) {
      if (!file || !file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          if (isTop) {
            uploadedImgTop = img;
          } else {
            uploadedImgBot = img;
          }
          previewImg.src = e.target.result;
          previewImg.classList.remove("hidden");
          dropMsg.classList.add("hidden");
          clearWrapper.classList.remove("hidden");

          setPreviewView("card");
          render();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    });

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "#2563eb";
    });
    dropZone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "#cbd5e1";
    });
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "#cbd5e1";
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    });
  }

  setupFileUpload(dropZoneTop, fileTop, previewImgTop, dropMsgTop, uploadClearTopWrapper, true);
  setupFileUpload(dropZoneBot, fileBot, previewImgBot, dropMsgBot, uploadClearBotWrapper, false);

  btnClearImgTop.addEventListener("click", () => {
    uploadedImgTop = null;
    fileTop.value = "";
    previewImgTop.classList.add("hidden");
    dropMsgTop.classList.remove("hidden");
    uploadClearTopWrapper.classList.add("hidden");
    render();
  });

  btnClearImgBot.addEventListener("click", () => {
    uploadedImgBot = null;
    fileBot.value = "";
    previewImgBot.classList.add("hidden");
    dropMsgBot.classList.remove("hidden");
    uploadClearBotWrapper.classList.add("hidden");
    render();
  });

  function generateQRCodeCanvas(text, size) {
    if (!text || typeof QRCode === "undefined") return null;
    const tempDiv = document.createElement("div");
    try {
      new QRCode(tempDiv, {
        text: text,
        width: size,
        height: size,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M,
      });
      return tempDiv.querySelector("canvas");
    } catch (e) {
      console.warn("QR Error:", e);
      return null;
    }
  }

  // ========================================================
  // 表面名刺レンダリング（単体・600 DPI）
  // ========================================================
  function renderFrontCardCanvas(isInteractive = false) {
    cardExportCanvas.width = CARD_W;
    cardExportCanvas.height = CARD_H;
    const ctx = cardExportCtx;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    // 背景画像
    if (uploadedImgTop) {
      ctx.drawImage(uploadedImgTop, 0, 0, CARD_W, CARD_H);
    }

    const shouldDrawText = (currentMainMode !== "upload") || checkOverlayText.checked;
    if (!shouldDrawText) {
      for (const key of Object.keys(elementBBoxes)) {
        delete elementBBoxes[key];
      }
      return cardExportCanvas;
    }

    ctx.textBaseline = "middle";

    const themeColor = themeColorInput.value;
    const fontFamily =
      fontSelect.value === "serif"
        ? '"Noto Serif JP", "BIZ UDMincho", "Yu Mincho", "Hiragino Mincho ProN", serif'
        : '"Noto Sans JP", "BIZ UDGothic", "Hiragino Sans", "Yu Gothic", sans-serif';

    // 装飾ライン
    if (checkLine.checked) {
      const l = elements.line;
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = l.height;
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y);
      ctx.lineTo(l.x2, l.y);
      ctx.stroke();

      elementBBoxes["line"] = {
        x1: Math.min(l.x1, l.x2) - 10,
        y1: l.y - 20,
        x2: Math.max(l.x1, l.x2) + 10,
        y2: l.y + 20,
      };
    } else {
      delete elementBBoxes["line"];
    }

    // 会社名
    const isCompanyOn = !checkShowCompany || checkShowCompany.checked;
    const company = isCompanyOn ? (currentMainMode === "upload" && uploadInputCompany ? uploadInputCompany.value.trim() : inputCompany.value.trim()) : "";
    if (company) {
      const el = elements.company;
      ctx.fillStyle = el.color;
      ctx.font = `${el.weight || 600} ${el.size}px ${fontFamily}`;
      ctx.textAlign = el.align;
      ctx.fillText(company, el.x, el.y);

      const metrics = ctx.measureText(company);
      const textW = metrics.width;
      const textH = el.size;
      let left = el.x;
      if (el.align === "center") left = el.x - textW / 2;
      else if (el.align === "right") left = el.x - textW;

      elementBBoxes["company"] = {
        x1: left - 15,
        y1: el.y - textH / 2 - 10,
        x2: left + textW + 15,
        y2: el.y + textH / 2 + 10,
      };
    } else {
      delete elementBBoxes["company"];
    }

    // 役職 / 肩書
    const isTitleOn = !checkShowTitle || checkShowTitle.checked;
    const title = isTitleOn ? (currentMainMode === "upload" && uploadInputTitle ? uploadInputTitle.value.trim() : inputTitle.value.trim()) : "";
    if (title) {
      const el = elements.title;
      ctx.fillStyle = el.color;
      ctx.font = `${el.weight || 500} ${el.size}px ${fontFamily}`;
      ctx.textAlign = el.align;
      ctx.fillText(title, el.x, el.y);

      const metrics = ctx.measureText(title);
      const textW = metrics.width;
      const textH = el.size;
      let left = el.x;
      if (el.align === "center") left = el.x - textW / 2;
      else if (el.align === "right") left = el.x - textW;

      elementBBoxes["title"] = {
        x1: left - 15,
        y1: el.y - textH / 2 - 10,
        x2: left + textW + 15,
        y2: el.y + textH / 2 + 10,
      };
    } else {
      delete elementBBoxes["title"];
    }

    // ふりがな
    const isKanaOn = !checkShowKana || checkShowKana.checked;
    const kana = isKanaOn ? (currentMainMode === "upload" && uploadInputKana ? uploadInputKana.value.trim() : inputKana.value.trim()) : "";
    if (kana) {
      const el = elements.kana;
      ctx.fillStyle = el.color;
      ctx.font = `${el.weight || 500} ${el.size}px ${fontFamily}`;
      ctx.textAlign = el.align;
      ctx.fillText(kana, el.x, el.y);

      const metrics = ctx.measureText(kana);
      const textW = metrics.width;
      const textH = el.size;
      let left = el.x;
      if (el.align === "center") left = el.x - textW / 2;
      else if (el.align === "right") left = el.x - textW;

      elementBBoxes["kana"] = {
        x1: left - 15,
        y1: el.y - textH / 2 - 10,
        x2: left + textW + 15,
        y2: el.y + textH / 2 + 10,
      };
    } else {
      delete elementBBoxes["kana"];
    }

    // 氏名（なまえ）
    const isNameOn = !checkShowName || checkShowName.checked;
    const name = isNameOn ? (currentMainMode === "upload" && uploadInputName ? uploadInputName.value.trim() : inputName.value.trim()) : "";
    if (name) {
      const el = elements.name;
      ctx.fillStyle = el.color;
      ctx.font = `${el.weight || 700} ${el.size}px ${fontFamily}`;
      ctx.textAlign = el.align;
      ctx.fillText(name, el.x, el.y);

      const metrics = ctx.measureText(name);
      const textW = metrics.width;
      const textH = el.size;
      let left = el.x;
      if (el.align === "center") left = el.x - textW / 2;
      else if (el.align === "right") left = el.x - textW;

      elementBBoxes["name"] = {
        x1: left - 20,
        y1: el.y - textH / 2 - 15,
        x2: left + textW + 20,
        y2: el.y + textH / 2 + 15,
      };
    } else {
      delete elementBBoxes["name"];
    }

    // 電話番号
    const isTelOn = !checkShowTel || checkShowTel.checked;
    const telRaw = currentMainMode === "upload" && uploadInputTel ? uploadInputTel.value.trim() : inputTel.value.trim();
    const telText = telRaw ? (telRaw.startsWith("TEL:") || telRaw.startsWith("tel:") ? telRaw : `TEL: ${telRaw}`) : "";
    if (isTelOn && telText) {
      const el = elements.tel;
      ctx.fillStyle = el.color;
      ctx.font = `${el.weight || 400} ${el.size}px ${fontFamily}`;
      ctx.textAlign = el.align;
      ctx.fillText(telText, el.x, el.y);

      const metrics = ctx.measureText(telText);
      const textW = metrics.width;
      const textH = el.size;
      let left = el.x;
      if (el.align === "center") left = el.x - textW / 2;
      else if (el.align === "right") left = el.x - textW;

      elementBBoxes["tel"] = {
        x1: left - 15,
        y1: el.y - textH / 2 - 10,
        x2: left + textW + 15,
        y2: el.y + textH / 2 + 10,
      };
    } else {
      delete elementBBoxes["tel"];
    }

    // メールアドレス
    const isEmailOn = !checkShowEmail || checkShowEmail.checked;
    const emailRaw = currentMainMode === "upload" && uploadInputEmail ? uploadInputEmail.value.trim() : inputEmail.value.trim();
    const emailText = emailRaw ? (emailRaw.startsWith("Mail:") || emailRaw.startsWith("mail:") ? emailRaw : `Mail: ${emailRaw}`) : "";
    if (isEmailOn && emailText) {
      const el = elements.email;
      ctx.fillStyle = el.color;
      ctx.font = `${el.weight || 400} ${el.size}px ${fontFamily}`;
      ctx.textAlign = el.align;
      ctx.fillText(emailText, el.x, el.y);

      const metrics = ctx.measureText(emailText);
      const textW = metrics.width;
      const textH = el.size;
      let left = el.x;
      if (el.align === "center") left = el.x - textW / 2;
      else if (el.align === "right") left = el.x - textW;

      elementBBoxes["email"] = {
        x1: left - 15,
        y1: el.y - textH / 2 - 10,
        x2: left + textW + 15,
        y2: el.y + textH / 2 + 10,
      };
    } else {
      delete elementBBoxes["email"];
    }

    // Web / SNS
    const isUrlOn = !checkShowUrl || checkShowUrl.checked;
    const urlRaw = currentMainMode === "upload" && uploadInputUrl ? uploadInputUrl.value.trim() : inputUrl.value.trim();
    const urlText = urlRaw ? (urlRaw.startsWith("Web:") || urlRaw.startsWith("web:") ? urlRaw : `Web: ${urlRaw}`) : "";
    if (isUrlOn && urlText) {
      const el = elements.url;
      ctx.fillStyle = el.color;
      ctx.font = `${el.weight || 400} ${el.size}px ${fontFamily}`;
      ctx.textAlign = el.align;
      ctx.fillText(urlText, el.x, el.y);

      const metrics = ctx.measureText(urlText);
      const textW = metrics.width;
      const textH = el.size;
      let left = el.x;
      if (el.align === "center") left = el.x - textW / 2;
      else if (el.align === "right") left = el.x - textW;

      elementBBoxes["url"] = {
        x1: left - 15,
        y1: el.y - textH / 2 - 10,
        x2: left + textW + 15,
        y2: el.y + textH / 2 + 10,
      };
    } else {
      delete elementBBoxes["url"];
    }

    // 住所
    const isAddressOn = !checkShowAddress || checkShowAddress.checked;
    const addressRaw = currentMainMode === "upload" && uploadInputAddress ? uploadInputAddress.value.trim() : inputAddress.value.trim();
    const addressText = addressRaw ? (addressRaw.startsWith("Add:") || addressRaw.startsWith("add:") ? addressRaw : `Add: ${addressRaw}`) : "";
    if (isAddressOn && addressText) {
      const el = elements.address;
      ctx.fillStyle = el.color;
      ctx.font = `${el.weight || 400} ${el.size}px ${fontFamily}`;
      ctx.textAlign = el.align;
      ctx.fillText(addressText, el.x, el.y);

      const metrics = ctx.measureText(addressText);
      const textW = metrics.width;
      const textH = el.size;
      let left = el.x;
      if (el.align === "center") left = el.x - textW / 2;
      else if (el.align === "right") left = el.x - textW;

      elementBBoxes["address"] = {
        x1: left - 15,
        y1: el.y - textH / 2 - 10,
        x2: left + textW + 15,
        y2: el.y + textH / 2 + 10,
      };
    } else {
      delete elementBBoxes["address"];
    }

    // QRコード
    const qrUrl = (currentMainMode === "upload" && uploadInputUrl ? uploadInputUrl.value.trim() : inputUrl.value.trim());
    if (checkQr.checked && qrUrl) {
      const el = elements.qr;
      const qrCanvas = generateQRCodeCanvas(qrUrl, el.size);
      if (qrCanvas) {
        ctx.drawImage(qrCanvas, el.x, el.y, el.size, el.size);
        elementBBoxes["qr"] = {
          x1: el.x - 8,
          y1: el.y - 8,
          x2: el.x + el.size + 8,
          y2: el.y + el.size + 8,
        };
      }
    } else {
      delete elementBBoxes["qr"];
    }

    // 表面ハイライト枠＆スナップガイド
    if (isInteractive && currentViewMode === "card") {
      if (showSnapLineX) {
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.moveTo(CARD_CENTER_X, 0);
        ctx.lineTo(CARD_CENTER_X, CARD_H);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (showSnapLineY) {
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.moveTo(0, CARD_CENTER_Y);
        ctx.lineTo(CARD_W, CARD_CENTER_Y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const bbox = elementBBoxes[selectedElementId];
      if (bbox) {
        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 8]);
        ctx.strokeRect(bbox.x1, bbox.y1, bbox.x2 - bbox.x1, bbox.y2 - bbox.y1);
        ctx.setLineDash([]);

        ctx.fillStyle = "#2563eb";
        const dotSize = 10;
        ctx.fillRect(bbox.x1 - dotSize / 2, bbox.y1 - dotSize / 2, dotSize, dotSize);
        ctx.fillRect(bbox.x2 - dotSize / 2, bbox.y1 - dotSize / 2, dotSize, dotSize);
        ctx.fillRect(bbox.x1 - dotSize / 2, bbox.y2 - dotSize / 2, dotSize, dotSize);
        ctx.fillRect(bbox.x2 - dotSize / 2, bbox.y2 - dotSize / 2, dotSize, dotSize);
      }
    }

    return cardExportCanvas;
  }

  // ========================================================
  // ★ 裏面名刺レンダリング（単体・600 DPI・完全インタラクティブ対応！）
  // ========================================================
  function renderBackCardCanvas(isInteractive = false) {
    backCardExportCanvas.width = CARD_W;
    backCardExportCanvas.height = CARD_H;
    const ctx = backCardExportCtx;

    ctx.fillStyle = "#fafbfc";
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    // 裏面背景画像があれば描画
    if (uploadedImgBot) {
      ctx.drawImage(uploadedImgBot, 0, 0, CARD_W, CARD_H);
    }

    // 枠線
    if (checkBackBorder.checked) {
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 4;
      ctx.strokeRect(80, 80, CARD_W - 160, CARD_H - 160);
    }

    ctx.textBaseline = "middle";
    const themeColor = themeColorInput.value;
    const fontFamily =
      fontSelect.value === "serif"
        ? '"Noto Serif JP", "BIZ UDMincho", "Yu Mincho", "Hiragino Mincho ProN", serif'
        : '"Noto Sans JP", "BIZ UDGothic", "Hiragino Sans", "Yu Gothic", sans-serif';

    // 1. 裏面見出し
    const isHeadingOn = !checkShowBackHeading || checkShowBackHeading.checked;
    const heading = inputBackHeading.value.trim();
    if (isHeadingOn && heading) {
      const el = backElements.heading;
      ctx.fillStyle = el.color || themeColor;
      ctx.font = `${el.weight || 700} ${el.size}px ${fontFamily}`;
      ctx.textAlign = el.align;
      ctx.fillText(heading, el.x, el.y);

      const w = ctx.measureText(heading).width;
      let left = el.x;
      if (el.align === "center") left = el.x - w / 2;
      else if (el.align === "right") left = el.x - w;

      backElementBBoxes["heading"] = {
        x1: left - 15,
        y1: el.y - el.size / 2 - 10,
        x2: left + w + 15,
        y2: el.y + el.size / 2 + 10,
      };
    } else {
      delete backElementBBoxes["heading"];
    }

    // 装飾ライン
    if (checkBackLine && checkBackLine.checked) {
      const el = backElements.line;
      ctx.fillStyle = el.color || themeColor;
      ctx.fillRect(el.x1, el.y - (el.height || 4) / 2, el.x2 - el.x1, el.height || 4);
      backElementBBoxes["line"] = {
        x1: Math.min(el.x1, el.x2) - 10,
        y1: el.y - 20,
        x2: Math.max(el.x1, el.x2) + 10,
        y2: el.y + 20,
      };
    } else {
      delete backElementBBoxes["line"];
    }

    // 2. 項目1
    const isText1On = !checkShowBackText1 || checkShowBackText1.checked;
    const text1 = inputBackText1.value.trim();
    if (isText1On && text1) {
      const el = backElements.text1;
      ctx.fillStyle = el.color;
      ctx.font = `${el.weight || 500} ${el.size}px ${fontFamily}`;
      ctx.textAlign = el.align;
      ctx.fillText(text1, el.x, el.y);

      const w = ctx.measureText(text1).width;
      let left = el.x;
      if (el.align === "center") left = el.x - w / 2;
      else if (el.align === "right") left = el.x - w;

      backElementBBoxes["text1"] = {
        x1: left - 15,
        y1: el.y - el.size / 2 - 10,
        x2: left + w + 15,
        y2: el.y + el.size / 2 + 10,
      };
    } else {
      delete backElementBBoxes["text1"];
    }

    // 3. 項目2
    const isText2On = !checkShowBackText2 || checkShowBackText2.checked;
    const text2 = inputBackText2.value.trim();
    if (isText2On && text2) {
      const el = backElements.text2;
      ctx.fillStyle = el.color;
      ctx.font = `${el.weight || 500} ${el.size}px ${fontFamily}`;
      ctx.textAlign = el.align;
      ctx.fillText(text2, el.x, el.y);

      const w = ctx.measureText(text2).width;
      let left = el.x;
      if (el.align === "center") left = el.x - w / 2;
      else if (el.align === "right") left = el.x - w;

      backElementBBoxes["text2"] = {
        x1: left - 15,
        y1: el.y - el.size / 2 - 10,
        x2: left + w + 15,
        y2: el.y + el.size / 2 + 10,
      };
    } else {
      delete backElementBBoxes["text2"];
    }

    // 4. 項目3
    const isText3On = !checkShowBackText3 || checkShowBackText3.checked;
    const text3 = inputBackText3.value.trim();
    if (isText3On && text3) {
      const el = backElements.text3;
      ctx.fillStyle = el.color;
      ctx.font = `${el.weight || 400} ${el.size}px ${fontFamily}`;
      ctx.textAlign = el.align;
      ctx.fillText(text3, el.x, el.y);

      const w = ctx.measureText(text3).width;
      let left = el.x;
      if (el.align === "center") left = el.x - w / 2;
      else if (el.align === "right") left = el.x - w;

      backElementBBoxes["text3"] = {
        x1: left - 15,
        y1: el.y - el.size / 2 - 10,
        x2: left + w + 15,
        y2: el.y + el.size / 2 + 10,
      };
    } else {
      delete backElementBBoxes["text3"];
    }

    // 5. 項目4
    const isText4On = !checkShowBackText4 || checkShowBackText4.checked;
    const text4 = inputBackText4 ? inputBackText4.value.trim() : "";
    if (isText4On && text4) {
      const el = backElements.text4;
      ctx.fillStyle = el.color;
      ctx.font = `${el.weight || 400} ${el.size}px ${fontFamily}`;
      ctx.textAlign = el.align;
      ctx.fillText(text4, el.x, el.y);

      const w = ctx.measureText(text4).width;
      let left = el.x;
      if (el.align === "center") left = el.x - w / 2;
      else if (el.align === "right") left = el.x - w;

      backElementBBoxes["text4"] = {
        x1: left - 15,
        y1: el.y - el.size / 2 - 10,
        x2: left + w + 15,
        y2: el.y + el.size / 2 + 10,
      };
    } else {
      delete backElementBBoxes["text4"];
    }

    // 6. 裏面QRコード
    const backQrUrl = inputBackQrUrl.value.trim();
    if (checkBackQr.checked && backQrUrl) {
      const el = backElements.qr;
      const qrCanvas = generateQRCodeCanvas(backQrUrl, el.size);
      if (qrCanvas) {
        ctx.drawImage(qrCanvas, el.x, el.y, el.size, el.size);
        backElementBBoxes["qr"] = {
          x1: el.x - 8,
          y1: el.y - 8,
          x2: el.x + el.size + 8,
          y2: el.y + el.size + 8,
        };
      }
    } else {
      delete backElementBBoxes["qr"];
    }

    // 裏面編集中の選択枠＆スナップ線
    if (isInteractive && currentViewMode === "card") {
      if (showSnapLineX) {
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.moveTo(CARD_CENTER_X, 0);
        ctx.lineTo(CARD_CENTER_X, CARD_H);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (showSnapLineY) {
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.moveTo(0, CARD_CENTER_Y);
        ctx.lineTo(CARD_W, CARD_CENTER_Y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const bbox = backElementBBoxes[selectedElementId];
      if (bbox) {
        ctx.strokeStyle = "#4338ca";
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 8]);
        ctx.strokeRect(bbox.x1, bbox.y1, bbox.x2 - bbox.x1, bbox.y2 - bbox.y1);
        ctx.setLineDash([]);

        ctx.fillStyle = "#4338ca";
        const dotSize = 10;
        ctx.fillRect(bbox.x1 - dotSize / 2, bbox.y1 - dotSize / 2, dotSize, dotSize);
        ctx.fillRect(bbox.x2 - dotSize / 2, bbox.y1 - dotSize / 2, dotSize, dotSize);
        ctx.fillRect(bbox.x1 - dotSize / 2, bbox.y2 - dotSize / 2, dotSize, dotSize);
        ctx.fillRect(bbox.x2 - dotSize / 2, bbox.y2 - dotSize / 2, dotSize, dotSize);
      }
    }

    return backCardExportCanvas;
  }

  // ========================================================
  // ★ はがきレイアウト（2面付け & 郵便番号枠回避 & トンボ描画）
  // ========================================================
  function renderHagakiCanvas(topCardImg, botCardImg, forceRotate180 = false) {
    const dpi = parseInt(optDpi.value, 10);
    const hagakiW = Math.round((HAGAKI_W_MM / 25.4) * dpi);
    const hagakiH = Math.round((HAGAKI_H_MM / 25.4) * dpi);
    const cardW = Math.round((CARD_W_MM / 25.4) * dpi);
    const cardH = Math.round((CARD_H_MM / 25.4) * dpi);
    const gapPx = Math.round((parseFloat(optGap.value) / 25.4) * dpi);

    exportCanvas.width = hagakiW;
    exportCanvas.height = hagakiH;

    exportCtx.fillStyle = "#ffffff";
    exportCtx.fillRect(0, 0, hagakiW, hagakiH);

    // 水平中央マージン
    const marginX = Math.round((hagakiW - cardW) / 2);

    // ★ 垂直マージンの計算（郵便番号枠回避）
    let marginY = 0;
    const avoidPostal = optAvoidPostal.checked;

    if (avoidPostal) {
      // 郵便番号枠（上端から約12〜20mm）を完全に回避するため、上余白を25.0mmに設定！
      // 148mm - 25mm(上) - 110mm(名刺2枚) = 13mm(下余白)
      marginY = Math.round((25.0 / 25.4) * dpi);
    } else {
      // 均等中央（無地はがき用: 上下19mmずつ）
      const totalH = cardH * 2 + gapPx;
      marginY = Math.round((hagakiH - totalH) / 2);
    }

    const topX1 = marginX;
    const topY1 = marginY;
    const topX2 = topX1 + cardW;
    const topY2 = topY1 + cardH;

    const botX1 = marginX;
    const botY1 = topY2 + gapPx;
    const botX2 = botX1 + cardW;
    const botY2 = botY1 + cardH;

    // ★ 180度回転処理（裏面印刷時）
    // 表面で「上余白25mm、下余白13mm」の状態で180度回転させると、
    // 画像は「上余白13mm、下余白25mm」となる。
    // 用紙を天地逆（下端13mm側を先頭）にしてコピー機にセットすると、
    // 用紙の上での物理的位置が表面（25mm〜135mm）と寸分狂わずピッタリ一致する！
    const shouldRotate = forceRotate180 || optRotate.checked;
    if (shouldRotate) {
      exportCtx.save();
      exportCtx.translate(hagakiW / 2, hagakiH / 2);
      exportCtx.rotate(Math.PI);
      exportCtx.translate(-hagakiW / 2, -hagakiH / 2);
    }

    if (topCardImg) {
      exportCtx.drawImage(topCardImg, topX1, topY1, cardW, cardH);
    } else {
      exportCtx.fillStyle = "#f8fafc";
      exportCtx.fillRect(topX1, topY1, cardW, cardH);
      exportCtx.strokeStyle = "#cbd5e1";
      exportCtx.strokeRect(topX1, topY1, cardW, cardH);
    }

    if (botCardImg) {
      exportCtx.drawImage(botCardImg, botX1, botY1, cardW, cardH);
    } else {
      exportCtx.fillStyle = "#f8fafc";
      exportCtx.fillRect(botX1, botY1, cardW, cardH);
      exportCtx.strokeStyle = "#cbd5e1";
      exportCtx.strokeRect(botX1, botY1, cardW, cardH);
    }

    // トンボ・切り取り線描画
    const showBorder = optBorder.checked;
    const showCropmarks = optCropmarks.checked;

    if (showCropmarks || showBorder) {
      const markLen = Math.round((3.5 / 25.4) * dpi);
      const lineW = Math.max(1, Math.round((0.15 / 25.4) * dpi));
      const markColor = "#333333";
      const borderColor = "#d1d5db";

      if (showCropmarks) {
        drawCropMarks(exportCtx, topX1, topY1, topX2, topY2, hagakiW, hagakiH, markLen, lineW, markColor, showBorder, borderColor);
        drawCropMarks(exportCtx, botX1, botY1, botX2, botY2, hagakiW, hagakiH, markLen, lineW, markColor, showBorder, borderColor);

        exportCtx.strokeStyle = markColor;
        exportCtx.lineWidth = lineW;
        if (gapPx === 0) {
          exportCtx.beginPath();
          exportCtx.moveTo(0, topY2); exportCtx.lineTo(topX1, topY2);
          exportCtx.moveTo(topX2, topY2); exportCtx.lineTo(hagakiW, topY2);
          exportCtx.stroke();
        } else {
          exportCtx.beginPath();
          exportCtx.moveTo(0, topY2); exportCtx.lineTo(topX1, topY2);
          exportCtx.moveTo(topX2, topY2); exportCtx.lineTo(hagakiW, topY2);
          exportCtx.moveTo(0, botY1); exportCtx.lineTo(botX1, botY1);
          exportCtx.moveTo(botX2, botY1); exportCtx.lineTo(hagakiW, botY1);
          exportCtx.stroke();
        }

        exportCtx.strokeStyle = "#b0b0b0";
        exportCtx.lineWidth = 1;
        exportCtx.beginPath();
        exportCtx.moveTo(topX1, 0); exportCtx.lineTo(topX1, Math.max(0, topY1 - markLen / 2));
        exportCtx.moveTo(topX1, Math.min(hagakiH, botY2 + markLen / 2)); exportCtx.lineTo(topX1, hagakiH);
        exportCtx.moveTo(topX2, 0); exportCtx.lineTo(topX2, Math.max(0, topY1 - markLen / 2));
        exportCtx.moveTo(topX2, Math.min(hagakiH, botY2 + markLen / 2)); exportCtx.lineTo(topX2, hagakiH);
        exportCtx.stroke();
      } else if (showBorder) {
        exportCtx.strokeStyle = borderColor;
        exportCtx.lineWidth = Math.max(1, Math.round(lineW / 2));
        exportCtx.strokeRect(topX1, topY1, cardW, cardH);
        exportCtx.strokeRect(botX1, botY1, cardW, cardH);
      }
    }

    if (shouldRotate) {
      exportCtx.restore();
    }

    return exportCanvas;
  }

  function drawCropMarks(ctx, x1, y1, x2, y2, hagakiW, hagakiH, markLen, lineW, markColor, showBorder, borderColor) {
    if (showBorder) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = Math.max(1, Math.round(lineW / 2));
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    }
    ctx.strokeStyle = markColor;
    ctx.lineWidth = lineW;

    ctx.beginPath();
    ctx.moveTo(Math.max(0, x1 - markLen), y1); ctx.lineTo(x1, y1);
    ctx.moveTo(x1, Math.max(0, y1 - markLen)); ctx.lineTo(x1, y1);
    ctx.moveTo(x2, y1); ctx.lineTo(Math.min(hagakiW, x2 + markLen), y1);
    ctx.moveTo(x2, Math.max(0, y1 - markLen)); ctx.lineTo(x2, y1);
    ctx.moveTo(Math.max(0, x1 - markLen), y2); ctx.lineTo(x1, y2);
    ctx.moveTo(x1, y2); ctx.lineTo(x1, Math.min(hagakiH, y2 + markLen));
    ctx.moveTo(x2, y2); ctx.lineTo(Math.min(hagakiW, x2 + markLen), y2);
    ctx.moveTo(x2, y2); ctx.lineTo(x2, Math.min(hagakiH, y2 + markLen));
    ctx.stroke();
  }

  // ========================================================
  // メイン画面レンダリング（プレビュー）
  // ========================================================
  function render() {
    let currentTopCard = null;
    let currentBotCard = null;

    if (currentMainMode === "single") {
      const frontCard = renderFrontCardCanvas(false);
      currentTopCard = frontCard;
      currentBotCard = frontCard;
      renderHagakiCanvas(currentTopCard, currentBotCard);
    } else if (currentMainMode === "double") {
      const frontCard = renderFrontCardCanvas(false);
      const backCard = renderBackCardCanvas(false);

      if (currentDoubleSide === "front") {
        currentTopCard = frontCard;
        currentBotCard = frontCard;
        renderHagakiCanvas(currentTopCard, currentBotCard, false);
      } else {
        currentTopCard = backCard;
        currentBotCard = backCard;
        // プレビューでも裏面は180度回転後の状態を確認可能
        renderHagakiCanvas(currentTopCard, currentBotCard, true);
      }
    } else if (currentMainMode === "upload") {
      const frontCardWithOverlay = renderFrontCardCanvas(false);
      const isDoubleUpload = document.querySelector('input[name="upload_type"]:checked').value === "double";

      currentTopCard = frontCardWithOverlay;
      currentBotCard = isDoubleUpload && uploadedImgBot ? uploadedImgBot : frontCardWithOverlay;
      renderHagakiCanvas(currentTopCard, currentBotCard);
    }

    // プレビュー表示（超高解像度：Retina/4K対応・解像度ロスなし）
    if (currentViewMode === "card") {
      if (currentMainMode === "double" && currentDoubleSide === "back") {
        // ★ 裏面の名刺拡大編集（超高解像度 2150x1299）
        renderBackCardCanvas(true);
        previewCanvas.width = CARD_W;
        previewCanvas.height = CARD_H;
        previewCtx.imageSmoothingQuality = "high";
        previewCtx.drawImage(backCardExportCanvas, 0, 0);
      } else {
        // ★ 表面の名刺拡大編集（超高解像度 2150x1299）
        renderFrontCardCanvas(true);
        previewCanvas.width = CARD_W;
        previewCanvas.height = CARD_H;
        previewCtx.imageSmoothingQuality = "high";
        previewCtx.drawImage(cardExportCanvas, 0, 0);
      }
    } else {
      // ★ はがき全体プレビュー（超高解像度 2362x3496）
      previewCanvas.width = exportCanvas.width;
      previewCanvas.height = exportCanvas.height;
      previewCtx.imageSmoothingQuality = "high";
      previewCtx.drawImage(exportCanvas, 0, 0);
    }
  }

  // ========================================================
  // 座標変換
  // ========================================================
  function getCanvasLogicalCoords(clientX, clientY) {
    const rect = previewCanvas.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const offsetY = clientY - rect.top;

    const ratioX = Math.max(0, Math.min(1, offsetX / rect.width));
    const ratioY = Math.max(0, Math.min(1, offsetY / rect.height));

    return {
      x: ratioX * CARD_W,
      y: ratioY * CARD_H,
    };
  }

  // ========================================================
  // マウス＆タッチドラッグ・パン移動処理（表面・裏面・はがき 両対応！）
  // ========================================================
  let isPanning = false;

  let dragStartX = 0;
  let dragStartY = 0;
  let dragLastX = 0;
  let dragLastY = 0;
  let dragDistance = 0;

  let panStartX = 0;
  let panStartY = 0;
  let panLastX = 0;
  let panLastY = 0;
  let panStartScrollLeft = 0;
  let panStartScrollTop = 0;
  let panDistance = 0;

  // タッチ・マウスクリック時の要素判定（十分なタップ余裕度付き）
  function findHitElement(clientX, clientY, isTouch = false) {
    if (currentViewMode !== "card") return null;
    if (currentMainMode === "upload" && !checkOverlayText.checked) return null;

    const bboxes = getCurrentBBoxDict();
    const rect = previewCanvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    // キャンバスから離れすぎている場合は除外
    const margin = isTouch ? 25 : 10;
    if (
      clientX < rect.left - margin ||
      clientX > rect.right + margin ||
      clientY < rect.top - margin ||
      clientY > rect.bottom + margin
    ) {
      return null;
    }

    const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const offsetY = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const logicalX = (offsetX / rect.width) * CARD_W;
    const logicalY = (offsetY / rect.height) * CARD_H;

    // 画面CSSピクセル単位でのタップ余裕度（スマホ: 24px、PC: 12px）
    const padScreenPx = isTouch ? 24 : 12;
    const padLogicalX = (padScreenPx / rect.width) * CARD_W;
    const padLogicalY = (padScreenPx / rect.height) * CARD_H;

    let bestId = null;
    let minDistanceSq = Infinity;

    for (const [id, bbox] of Object.entries(bboxes)) {
      if (!bbox) continue;
      const x1 = bbox.x1 - padLogicalX;
      const x2 = bbox.x2 + padLogicalX;
      const y1 = bbox.y1 - padLogicalY;
      const y2 = bbox.y2 + padLogicalY;

      if (logicalX >= x1 && logicalX <= x2 && logicalY >= y1 && logicalY <= y2) {
        const cx = (bbox.x1 + bbox.x2) / 2;
        const cy = (bbox.y1 + bbox.y2) / 2;
        const dx = (logicalX - cx) / CARD_W;
        const dy = (logicalY - cy) / CARD_H;
        const distSq = dx * dx + dy * dy;

        if (distSq < minDistanceSq) {
          minDistanceSq = distSq;
          bestId = id;
        }
      }
    }

    return bestId;
  }

  function handleDragStart(clientX, clientY, isTouch = false) {
    flushArrowSnapshot();

    const hitId = findHitElement(clientX, clientY, isTouch);

    if (hitId) {
      // 要素の移動ドラッグ
      isDragging = true;
      isPanning = false;

      if (document.activeElement && document.activeElement.blur && document.activeElement !== previewCanvas) {
        document.activeElement.blur();
      }
      if (previewCanvas && previewCanvas.focus) {
        previewCanvas.focus();
      }

      dragStartX = clientX;
      dragStartY = clientY;
      dragLastX = clientX;
      dragLastY = clientY;
      dragDistance = 0;

      selectElement(hitId, true);
      dragStartSnapshot = getSnapshot();

      const elDict = getCurrentElementDict();
      const el = elDict[hitId];
      const pos = getCanvasLogicalCoords(clientX, clientY);
      if (hitId === "line") {
        dragOffsetLogicalX = pos.x - el.x1;
        dragOffsetLogicalY = pos.y - el.y;
      } else {
        dragOffsetLogicalX = pos.x - el.x;
        dragOffsetLogicalY = pos.y - el.y;
      }

      if (previewContainer) previewContainer.classList.add("is-dragging");
      previewCanvas.style.cursor = "grabbing";
      return true;
    } else {
      // 余白部分の視点パン（名刺/はがき移動）ドラッグ
      isDragging = false;
      isPanning = true;

      panStartX = clientX;
      panStartY = clientY;
      panLastX = clientX;
      panLastY = clientY;
      panDistance = 0;
      panStartScrollLeft = previewContainer ? previewContainer.scrollLeft : 0;
      panStartScrollTop = previewContainer ? previewContainer.scrollTop : 0;

      if (previewContainer) previewContainer.classList.add("is-panning");
      previewCanvas.style.cursor = "grabbing";
      return true;
    }
  }

  function handleDragMove(clientX, clientY) {
    if (isDragging) {
      dragDistance += Math.hypot(clientX - dragLastX, clientY - dragLastY);
      dragLastX = clientX;
      dragLastY = clientY;

      const pos = getCanvasLogicalCoords(clientX, clientY);
      const elDict = getCurrentElementDict();
      const el = elDict[selectedElementId];
      if (!el) return;

      if (selectedElementId === "line") {
        const lineLen = el.x2 - el.x1;
        let targetX1 = pos.x - dragOffsetLogicalX;
        let targetY = pos.y - dragOffsetLogicalY;

        showSnapLineY = Math.abs(targetY - CARD_CENTER_Y) < 20;
        if (showSnapLineY) targetY = CARD_CENTER_Y;

        el.x1 = targetX1;
        el.x2 = targetX1 + lineLen;
        el.y = targetY;
      } else {
        let targetX = pos.x - dragOffsetLogicalX;
        let targetY = pos.y - dragOffsetLogicalY;

        // 中央スナップ判定
        showSnapLineX = Math.abs(targetX - CARD_CENTER_X) < 22;
        if (showSnapLineX) {
          if (selectedElementId === "qr" && currentMainMode === "double" && currentDoubleSide === "back") {
            targetX = CARD_CENTER_X - (el.size || 220) / 2;
          } else {
            targetX = CARD_CENTER_X;
          }
        }

        showSnapLineY = Math.abs(targetY - CARD_CENTER_Y) < 22;
        if (showSnapLineY) targetY = CARD_CENTER_Y;

        el.x = targetX;
        el.y = targetY;
      }

      render();
    } else if (isPanning) {
      panDistance += Math.hypot(clientX - panLastX, clientY - panLastY);
      panLastX = clientX;
      panLastY = clientY;

      if (previewContainer) {
        const dx = clientX - panStartX;
        const dy = clientY - panStartY;
        previewContainer.scrollLeft = panStartScrollLeft - dx;
        previewContainer.scrollTop = panStartScrollTop - dy;
      }
    } else {
      // マウスホバー時のカーソル判定（PC）
      if (currentViewMode === "card") {
        const hit = findHitElement(clientX, clientY, false);
        previewCanvas.style.cursor = hit ? "move" : "grab";
      } else {
        previewCanvas.style.cursor = "grab";
      }
    }
  }

  function handleDragEnd() {
    if (previewContainer) {
      previewContainer.classList.remove("is-dragging", "is-panning");
    }

    if (isDragging) {
      isDragging = false;
      showSnapLineX = false;
      showSnapLineY = false;
      previewCanvas.style.cursor = "grab";

      if (dragStartSnapshot && dragDistance >= 2) {
        pushUndo(dragStartSnapshot);
      }
      dragStartSnapshot = null;

      render();

      if (previewCanvas && previewCanvas.focus) {
        previewCanvas.focus();
      }
    } else if (isPanning) {
      isPanning = false;
      previewCanvas.style.cursor = "grab";

      // 移動距離が5px未満なら「パン」ではなく「余白タップ（クリック）」と判定
      if (panDistance < 5) {
        if (currentViewMode === "card") {
          deselectElement();
        }
      }
    }
  }

  if (previewContainer) {
    previewContainer.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      handleDragStart(e.clientX, e.clientY, false);
    });

    previewContainer.addEventListener("touchstart", (e) => {
      if (e.touches && e.touches.length >= 2) {
        if (isDragging || isPanning) {
          isDragging = false;
          isPanning = false;
          if (previewContainer) previewContainer.classList.remove("is-dragging", "is-panning");
          render();
        }
        return; // ピンチズームに委ねる
      }
      if (e.touches && e.touches[0]) {
        handleDragStart(e.touches[0].clientX, e.touches[0].clientY, true);
        e.preventDefault();
      }
    }, { passive: false });
  }

  window.addEventListener("mousemove", (e) => {
    handleDragMove(e.clientX, e.clientY);
  });

  window.addEventListener("touchmove", (e) => {
    if (e.touches && e.touches.length >= 2) return;
    if ((isDragging || isPanning) && e.touches && e.touches[0]) {
      e.preventDefault();
      handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });

  window.addEventListener("mouseup", () => {
    handleDragEnd();
  });

  window.addEventListener("touchend", () => {
    handleDragEnd();
  });

  // ========================================================
  // キーボード操作（十字キーによる精密移動、Ctrl+Z/Ctrl+Y）
  // ========================================================
  window.addEventListener("keydown", (e) => {
    // フォーム入力欄にフォーカス中は文字入力・カーソル移動を優先
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.tagName === "SELECT")) {
      return;
    }

    const isCtrlOrMeta = e.ctrlKey || e.metaKey;
    if (isCtrlOrMeta) {
      if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }
      if (e.key === "y" || e.key === "Y") {
        e.preventDefault();
        redo();
        return;
      }
    }

    if (currentViewMode !== "card") return;
    if (currentMainMode === "upload" && !checkOverlayText.checked) return;

    const elDict = getCurrentElementDict();
    const el = elDict[selectedElementId];
    if (!el) return;

    let dx = 0;
    let dy = 0;
    // 通常は常に 1px ずつ、Shift同時押しで 25px（たくさん動かせる）
    const step = e.shiftKey ? 25 : 1;

    switch (e.key) {
      case "ArrowUp":
        dy = -step;
        break;
      case "ArrowDown":
        dy = step;
        break;
      case "ArrowLeft":
        dx = -step;
        break;
      case "ArrowRight":
        dx = step;
        break;
      default:
        return;
    }

    e.preventDefault();

    // 矢印キー移動のUndo記録（連続押下を450msで1まとめにグループ化）
    if (!arrowStartSnapshot) {
      arrowStartSnapshot = getSnapshot();
    }
    updateUndoRedoButtons();
    if (arrowKeyTimeout) clearTimeout(arrowKeyTimeout);
    arrowKeyTimeout = setTimeout(() => {
      if (arrowStartSnapshot) {
        pushUndo(arrowStartSnapshot);
        arrowStartSnapshot = null;
      }
    }, 450);

    if (selectedElementId === "line") {
      el.x1 += dx;
      el.x2 += dx;
      el.y += dy;
    } else {
      el.x += dx;
      el.y += dy;
    }

    render();
  });

  // 表面入力フォームと画像重ね用入力フォームの2方向同期
  const syncInputs = [
    { a: inputName, b: uploadInputName },
    { a: inputKana, b: uploadInputKana },
    { a: inputCompany, b: uploadInputCompany },
    { a: inputTitle, b: uploadInputTitle },
    { a: inputTel, b: uploadInputTel },
    { a: inputEmail, b: uploadInputEmail },
    { a: inputUrl, b: uploadInputUrl },
    { a: inputAddress, b: uploadInputAddress },
  ];

  syncInputs.forEach(({ a, b }) => {
    if (!a || !b) return;
    a.addEventListener("input", () => {
      b.value = a.value;
    });
    b.addEventListener("input", () => {
      a.value = b.value;
      if (selectedElementId && quickEditInput) {
        const target = getTargetInputForElement(selectedElementId);
        if (target === a || target === b) {
          quickEditInput.value = b.value;
        }
      }
      render();
    });
  });

  const syncCheckboxes = [
    { a: checkShowName, b: uploadCheckShowName, inputs: [inputName, uploadInputName] },
    { a: checkShowKana, b: uploadCheckShowKana, inputs: [inputKana, uploadInputKana] },
    { a: checkShowCompany, b: uploadCheckShowCompany, inputs: [inputCompany, uploadInputCompany] },
    { a: checkShowTitle, b: uploadCheckShowTitle, inputs: [inputTitle, uploadInputTitle] },
    { a: checkShowTel, b: uploadCheckShowTel, inputs: [inputTel, uploadInputTel] },
    { a: checkShowEmail, b: uploadCheckShowEmail, inputs: [inputEmail, uploadInputEmail] },
    { a: checkShowUrl, b: uploadCheckShowUrl, inputs: [inputUrl, uploadInputUrl] },
    { a: checkShowAddress, b: uploadCheckShowAddress, inputs: [inputAddress, uploadInputAddress] },
    { a: checkQr, b: uploadCheckQr, inputs: [] },
    { a: checkLine, b: uploadCheckLine, inputs: [] },
  ];

  function updateVisualDisabled(item) {
    const isChecked = item.a ? item.a.checked : true;
    if (item.inputs) {
      item.inputs.forEach((inp) => {
        if (!inp) return;
        inp.classList.toggle("input-disabled-visual", !isChecked);
      });
    }
  }

  syncCheckboxes.forEach((item) => {
    const { a, b } = item;
    if (!a || !b) return;
    a.addEventListener("change", () => {
      b.checked = a.checked;
      updateVisualDisabled(item);
      render();
    });
    b.addEventListener("change", () => {
      a.checked = b.checked;
      updateVisualDisabled(item);
      render();
    });
  });

  const backSyncCheckboxes = [
    { cb: checkShowBackHeading, input: inputBackHeading },
    { cb: checkShowBackText1, input: inputBackText1 },
    { cb: checkShowBackText2, input: inputBackText2 },
    { cb: checkShowBackText3, input: inputBackText3 },
    { cb: checkShowBackText4, input: inputBackText4 },
  ];

  function updateBackVisualDisabled(item) {
    if (!item.cb || !item.input) return;
    item.input.classList.toggle("input-disabled-visual", !item.cb.checked);
  }

  backSyncCheckboxes.forEach((item) => {
    if (!item.cb) return;
    item.cb.addEventListener("change", () => {
      updateBackVisualDisabled(item);
      render();
    });
  });

  function updateAllBackVisualDisabled() {
    backSyncCheckboxes.forEach(updateBackVisualDisabled);
  }

  // フォーム入力監視
  const inputsToListen = [
    inputName, inputKana, inputCompany, inputTitle, inputTel, inputEmail,
    inputUrl, inputAddress, checkQr, checkLine, fontSelect,
    checkShowName, checkShowKana, checkShowCompany, checkShowTitle, checkShowTel, checkShowEmail, checkShowUrl, checkShowAddress,
    uploadInputName, uploadInputKana, uploadInputCompany, uploadInputTitle,
    uploadInputTel, uploadInputEmail, uploadInputUrl, uploadInputAddress,
    uploadCheckShowName, uploadCheckShowKana, uploadCheckShowCompany, uploadCheckShowTitle, uploadCheckShowTel, uploadCheckShowEmail,
    uploadCheckShowUrl, uploadCheckShowAddress, uploadCheckQr, uploadCheckLine,
    inputBackHeading, inputBackText1, inputBackText2, inputBackText3, inputBackText4, inputBackQrUrl,
    checkShowBackHeading, checkShowBackText1, checkShowBackText2, checkShowBackText3, checkShowBackText4,
    checkBackLine, checkBackQr, checkBackBorder, optAvoidPostal, optRotate, optBorder, optCropmarks, optGap, optDpi,
  ].filter(Boolean);

  inputsToListen.forEach((input) => {
    input.addEventListener("input", () => {
      // 選択中要素と連動していればクイック編集欄も同期
      const targetInput = getTargetInputForElement(selectedElementId);
      if (targetInput === input && quickEditInput && document.activeElement !== quickEditInput) {
        quickEditInput.value = input.value;
      }
      render();
    });
    input.addEventListener("change", render);
  });

  // フォーム入力欄フォーカス時にも該当要素を選択＆調整パネルを表示
  const inputToElementMap = new Map([
    [inputName, "name"],
    [uploadInputName, "name"],
    [inputKana, "kana"],
    [uploadInputKana, "kana"],
    [inputCompany, "company"],
    [uploadInputCompany, "company"],
    [inputTitle, "title"],
    [uploadInputTitle, "title"],
    [inputTel, "tel"],
    [uploadInputTel, "tel"],
    [inputEmail, "email"],
    [uploadInputEmail, "email"],
    [inputUrl, "url"],
    [uploadInputUrl, "url"],
    [inputAddress, "address"],
    [uploadInputAddress, "address"],
    [inputBackHeading, "heading"],
    [inputBackText1, "text1"],
    [inputBackText2, "text2"],
    [inputBackText3, "text3"],
    [inputBackText4, "text4"],
    [inputBackQrUrl, "qr"],
  ]);

  inputToElementMap.forEach((elId, inputEl) => {
    if (inputEl) {
      inputEl.addEventListener("focus", () => {
        selectElement(elId, true);
      });
    }
  });

  // ダウンロード保存機能
  function downloadCanvas(canvas, filename) {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  btnDownloadHagaki.addEventListener("click", () => {
    let topImg = null;
    let botImg = null;

    if (currentMainMode === "upload") {
      const frontCard = renderFrontCardCanvas(false);
      const isDoubleUpload = document.querySelector('input[name="upload_type"]:checked').value === "double";
      topImg = frontCard;
      botImg = isDoubleUpload && uploadedImgBot ? uploadedImgBot : frontCard;
    } else {
      const card = renderFrontCardCanvas(false);
      topImg = card;
      botImg = card;
    }

    renderHagakiCanvas(topImg, botImg);
    downloadCanvas(exportCanvas, "hagaki_meishi_print.png");
  });

  // 両面名刺用：表面保存
  btnDownloadFront.addEventListener("click", () => {
    const frontCard = renderFrontCardCanvas(false);
    renderHagakiCanvas(frontCard, frontCard, false);
    downloadCanvas(exportCanvas, "hagaki_meishi_1_front.png");
  });

  // 両面名刺用：裏面保存（自動で180度回転し、用紙天地逆セットで表面と完全一致）
  btnDownloadBack.addEventListener("click", () => {
    const backCard = renderBackCardCanvas(false);
    renderHagakiCanvas(backCard, backCard, true);
    downloadCanvas(exportCanvas, "hagaki_meishi_2_back_rotated180.png");
  });

  btnDownloadCard.addEventListener("click", () => {
    if (currentMainMode === "double" && currentDoubleSide === "back") {
      const backCard = renderBackCardCanvas(false);
      downloadCanvas(backCard, "meishi_back_single.png");
    } else {
      const frontCard = renderFrontCardCanvas(false);
      downloadCanvas(frontCard, "meishi_front_single.png");
    }
  });

  // モバイル用アクション
  mBtnScrollPreview.addEventListener("click", () => {
    if (previewSection.classList.contains("preview-collapsed")) {
      previewSection.classList.remove("preview-collapsed");
      if (previewToggleIcon) previewToggleIcon.textContent = "🔼";
      if (previewToggleText) previewToggleText.textContent = "折りたたむ";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  mBtnDownload.addEventListener("click", () => {
    if (currentMainMode === "double") {
      btnDownloadFront.click();
    } else {
      btnDownloadHagaki.click();
    }
  });

  // モーダル制御
  function openGuide() { guideModal.classList.remove("hidden"); }
  function closeGuide() { guideModal.classList.add("hidden"); }
  btnShowGuide.addEventListener("click", openGuide);
  btnHeaderGuide.addEventListener("click", openGuide);
  linkFooterGuide.addEventListener("click", (e) => { e.preventDefault(); openGuide(); });
  modalClose.addEventListener("click", closeGuide);
  modalClose2.addEventListener("click", closeGuide);

  function openPrivacy() { privacyModal.classList.remove("hidden"); }
  function closePrivacy() { privacyModal.classList.add("hidden"); }
  btnPrivacyLink.addEventListener("click", openPrivacy);
  linkFooterPrivacy.addEventListener("click", (e) => { e.preventDefault(); openPrivacy(); });
  linkFooterDisclaimer.addEventListener("click", (e) => { e.preventDefault(); openPrivacy(); });
  privacyModalClose.addEventListener("click", closePrivacy);
  privacyModalClose2.addEventListener("click", closePrivacy);

  window.addEventListener("click", (e) => {
    if (e.target === guideModal) closeGuide();
    if (e.target === privacyModal) closePrivacy();
  });

  // 初回ロード
  window.addEventListener("load", () => {
    applyPreset("left");
    applyBackPreset("business");
    switchMainMode("single");
    selectElement("name", false);
    closeElementEditor();
    syncCheckboxes.forEach(updateVisualDisabled);
    updateAllBackVisualDisabled();
    if (document.fonts) {
      document.fonts.ready.then(() => {
        render();
      });
    }
  });
})();
