import { Alert, Platform } from "react-native";
import Toast from "react-native-toast-message";

let Swal;
if (Platform.OS === "web") {
  Swal = require("sweetalert2").default;
}

/* =========================================================
   🔔 ICON DETECTION
========================================================= */
const getAlertIcon = (title, body) => {
  const text = `${title} ${body}`.toLowerCase().trim();

  if (
    text.includes("success") ||
    text.includes("saved") ||
    text.includes("done") ||
    text.includes("resolved") ||
    text.includes("welcome") ||
    text.includes("created") ||
    text.includes("updated") ||
    text.includes("completed") ||
    text.includes("approved") ||
    text.includes("verified") ||
    text.includes("activated") ||
    text.includes("registered") ||
    text.includes("connected") ||
    text.includes("uploaded") ||
    text.includes("downloaded")
  ) return "success";

  if (
    text.includes("error") ||
    text.includes("fail") ||
    text.includes("wrong") ||
    text.includes("denied") ||
    text.includes("invalid") ||
    text.includes("rejected") ||
    text.includes("expired") ||
    text.includes("cancelled") ||
    text.includes("blocked") ||
    text.includes("suspended") ||
    text.includes("terminated") ||
    text.includes("corrupted") ||
    text.includes("missing") ||
    text.includes("not found") ||
    text.includes("unauthorized")
  ) return "error";

  if (
    text.includes("warn") ||
    text.includes("caution") ||
    text.includes("weak") ||
    text.includes("warning") ||
    text.includes("attention") ||
    text.includes("notice") ||
    text.includes("alert") ||
    text.includes("reminder") ||
    text.includes("expiring") ||
    text.includes("almost") ||
    text.includes("nearly") ||
    text.includes("low") ||
    text.includes("critical") ||
    text.includes("important") ||
    text.includes("update required")
  ) return "warning";

  if (
    text.includes("?") ||
    text.includes("confirm") ||
    text.includes("are you sure") ||
    text.includes("do you want") ||
    text.includes("would you like") ||
    text.includes("proceed") ||
    text.includes("continue") ||
    text.includes("accept") ||
    text.includes("allow") ||
    text.includes("permission") ||
    text.includes("authorize")
  ) return "question";

  return "info";
};

/* =========================================================
   📱 MOBILE CENTERED BLUR MODAL TOAST (CUSTOM)
========================================================= */
const showMobileToast = (title, body, iconType = "info", buttons = []) => {
  const typeMap = {
    success: "success",
    error: "error",
    warning: "info",
    info: "info",
    question: "info",
  };

  const isAction = buttons && buttons.length > 1;

  Toast.show({
    type: typeMap[iconType] || "info",

    position: "center",

    text1: title,
    text2: body,

    visibilityTime: isAction ? 999999 : 3000,

    autoHide: !isAction,

    props: {
      blur: 0.6, // 60% background blur (handled in custom toast config UI)
      buttons: buttons || [],
    },
  });
};

/* =========================================================
   🌐 SWEETALERT CONFIG (WEB)
========================================================= */
const getSweetAlertConfig = (title, body, iconType) => {
  const baseConfig = {
    title,
    text: body,
    icon: iconType,
    confirmButtonText: "OK",
    customClass: {
      popup: "sweetalert-popup",
      title: "sweetalert-title",
      content: "sweetalert-content",
      confirmButton: "sweetalert-confirm-button",
      cancelButton: "sweetalert-cancel-button",
    },
  };

  if (Platform.OS === "web" && typeof document !== "undefined") {
    if (!document.getElementById("sweetalert-custom-styles")) {
      const style = document.createElement("style");
      style.id = "sweetalert-custom-styles";
      style.textContent = `
        .sweetalert-popup {
          border-radius: 14px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
        }
        .sweetalert-title {
          font-size: 1.2rem;
          font-weight: 700;
        }
        .sweetalert-content {
          font-size: 0.95rem;
          color: #6b7280;
        }
        .sweetalert-confirm-button {
          background: #4f46e5 !important;
          border-radius: 10px !important;
        }
        .sweetalert-cancel-button {
          background: #6b7280 !important;
          border-radius: 10px !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  return baseConfig;
};

/* =========================================================
   🔔 UNIFIED ALERT SYSTEM
========================================================= */
const unifiedAlert = (title, body, buttons = []) => {
  const iconType = getAlertIcon(title, body);

  /* =========================
     🌐 WEB (SweetAlert2)
  ========================= */
  if (Platform.OS === "web" && Swal) {
    const isConfirm = buttons.some((b) => b.style === "destructive");

    if (isConfirm) {
      const confirmBtn = buttons.find((b) => b.style === "destructive");
      const cancelBtn = buttons.find((b) => b.style === "cancel");

      Swal.fire({
        title,
        text: body,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: confirmBtn?.text || "Confirm",
        cancelButtonText: cancelBtn?.text || "Cancel",
      }).then((res) => {
        if (res.isConfirmed) confirmBtn?.onPress?.();
        if (res.dismiss === Swal.DismissReason.cancel) cancelBtn?.onPress?.();
      });

    } else {
      const config = getSweetAlertConfig(title, body, iconType);

      Swal.fire(config).then(() => {
        const okBtn = buttons.find((b) => b.style === "default" || !b.style);
        okBtn?.onPress?.();
      });
    }

    return;
  }

  /* =========================
     📱 MOBILE (CENTER BLUR MODAL TOAST)
  ========================= */
  showMobileToast(title, body, iconType, buttons);

  const primaryBtn = buttons.find(
    (b) => b.style === "default" || !b.style
  );

  if (primaryBtn?.onPress) {
    setTimeout(() => {
      primaryBtn.onPress();
    }, 3000);
  }
};

/* =========================================================
   🔔 PUBLIC API (UNCHANGED)
========================================================= */
export const triggerLocalNotification = (title, body, buttons) => {
  unifiedAlert(title, body, buttons);
};

export const NotificationTypes = {
  success: (title, body, buttons) =>
    unifiedAlert(title, body, buttons || [{ text: "OK" }]),

  error: (title, body, buttons) =>
    unifiedAlert(title, body, buttons || [{ text: "OK", style: "destructive" }]),

  warning: (title, body, buttons) =>
    unifiedAlert(title, body, buttons || [{ text: "OK" }]),

  info: (title, body, buttons) =>
    unifiedAlert(title, body, buttons || [{ text: "OK" }]),

  confirm: (
    title,
    body,
    onConfirm,
    onCancel,
    confirmText = "Confirm",
    cancelText = "Cancel"
  ) => {
    unifiedAlert(title, body, [
      { text: cancelText, style: "cancel", onPress: onCancel },
      { text: confirmText, style: "destructive", onPress: onConfirm },
    ]);
  },
};