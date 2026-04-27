import { Alert, Platform } from "react-native";

let Swal;
if (Platform.OS === "web") {
  Swal = require("sweetalert2").default;
}

// 🔔 Enhanced Icon Detection with 30+ patterns
const getAlertIcon = (title, body) => {
  const text = `${title} ${body}`.toLowerCase().trim();

  // Success patterns
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
  ) {
    return "success";
  }

  // Error patterns
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
  ) {
    return "error";
  }

  // Warning patterns
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
  ) {
    return "warning";
  }

  // Question patterns
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
  ) {
    return "question";
  }

  // Info patterns (default)
  if (
    text.includes("info") ||
    text.includes("notice") ||
    text.includes("tip") ||
    text.includes("hint") ||
    text.includes("guide") ||
    text.includes("instruction") ||
    text.includes("details") ||
    text.includes("information") ||
    text.includes("note") ||
    text.includes("reminder") ||
    text.includes("status") ||
    text.includes("progress")
  ) {
    return "info";
  }

  return "info"; // default
};

// 🔔 Enhanced SweetAlert Configuration
const getSweetAlertConfig = (title, body, buttons, iconType) => {
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

  // Add custom styles for web
  if (Platform.OS === "web") {
    // Inject custom CSS if not already added
    if (!document.getElementById("sweetalert-custom-styles")) {
      const style = document.createElement("style");
      style.id = "sweetalert-custom-styles";
      style.textContent = `
        .sweetalert-popup {
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .sweetalert-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }
        .sweetalert-content {
          font-size: 0.95rem;
          color: #6b7280;
          line-height: 1.5;
        }
        .sweetalert-confirm-button {
          background: #4f46e5 !important;
          border-radius: 8px !important;
          padding: 10px 24px !important;
          font-weight: 500 !important;
          border: none !important;
        }
        .sweetalert-cancel-button {
          background: #6b7280 !important;
          border-radius: 8px !important;
          padding: 10px 24px !important;
          font-weight: 500 !important;
          border: none !important;
        }
        .swal2-icon {
          margin: 1.5rem auto 1rem !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  return baseConfig;
};

// 🔔 Enhanced Unified Alert Handler
const unifiedAlert = (title, body, buttons) => {
  if (Platform.OS === "web" && typeof Swal !== "undefined") {
    const iconType = getAlertIcon(title, body);

    // Check if it's a confirmation alert (has a 'destructive' button)
    const isConfirmation =
      buttons && buttons.some((btn) => btn.style === "destructive");
    const isQuestion = buttons && buttons.length > 1 && !isConfirmation;

    if (isConfirmation) {
      const confirmButton = buttons.find((btn) => btn.style === "destructive");
      const cancelButton = buttons.find((btn) => btn.style === "cancel");
      const otherButtons = buttons.filter(
        (btn) => btn.style !== "destructive" && btn.style !== "cancel",
      );

      Swal.fire({
        title,
        text: body,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: confirmButton?.text || "Confirm",
        cancelButtonText: cancelButton?.text || "Cancel",
        showDenyButton: otherButtons.length > 0,
        denyButtonText: otherButtons[0]?.text || "No",
        customClass: {
          popup: "sweetalert-popup",
          title: "sweetalert-title",
          content: "sweetalert-content",
          confirmButton: "sweetalert-confirm-button",
          cancelButton: "sweetalert-cancel-button",
          denyButton: "sweetalert-cancel-button",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          if (confirmButton && typeof confirmButton.onPress === "function") {
            confirmButton.onPress();
          }
        } else if (result.isDenied) {
          if (
            otherButtons[0] &&
            typeof otherButtons[0].onPress === "function"
          ) {
            otherButtons[0].onPress();
          }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          if (cancelButton && typeof cancelButton.onPress === "function") {
            cancelButton.onPress();
          }
        }
      });
    } else if (isQuestion) {
      // Handle multiple choice alerts
      const buttonTexts = buttons.map((btn) => btn.text);
      const buttonValues = buttons.map((btn, index) => index.toString());

      Swal.fire({
        title,
        text: body,
        icon: iconType,
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: buttonTexts[0] || "Yes",
        denyButtonText: buttonTexts[1] || "No",
        cancelButtonText: buttonTexts[2] || "Cancel",
        customClass: {
          popup: "sweetalert-popup",
          title: "sweetalert-title",
          content: "sweetalert-content",
          confirmButton: "sweetalert-confirm-button",
          cancelButton: "sweetalert-cancel-button",
          denyButton: "sweetalert-cancel-button",
        },
      }).then((result) => {
        if (
          result.isConfirmed &&
          buttons[0] &&
          typeof buttons[0].onPress === "function"
        ) {
          buttons[0].onPress();
        } else if (
          result.isDenied &&
          buttons[1] &&
          typeof buttons[1].onPress === "function"
        ) {
          buttons[1].onPress();
        } else if (
          result.dismiss === Swal.DismissReason.cancel &&
          buttons[2] &&
          typeof buttons[2].onPress === "function"
        ) {
          buttons[2].onPress();
        }
      });
    } else {
      // Simple notification with enhanced styling
      const config = getSweetAlertConfig(title, body, buttons, iconType);

      Swal.fire(config).then((result) => {
        if (result.isConfirmed || result.isDismissed) {
          const okButton = buttons?.find(
            (btn) => btn.style === "default" || !btn.style,
          );
          if (okButton && typeof okButton.onPress === "function") {
            okButton.onPress();
          }
        }
      });
    }
  } else {
    // Native Alert with enhanced button handling
    const alertButtons = buttons || [{ text: "OK", style: "default" }];
    Alert.alert(title, body, alertButtons);
  }
};

// 🔔 Advanced Notification Types
export const triggerLocalNotification = (title, body, buttons) => {
  unifiedAlert(title, body, buttons);
};

// 🔔 Pre-defined Notification Types
export const NotificationTypes = {
  // Success notifications
  success: (title, body, buttons) => {
    unifiedAlert(title, body, buttons || [{ text: "OK", style: "default" }]);
  },

  // Error notifications
  error: (title, body, buttons) => {
    unifiedAlert(
      title,
      body,
      buttons || [{ text: "OK", style: "destructive" }],
    );
  },

  // Warning notifications
  warning: (title, body, buttons) => {
    unifiedAlert(title, body, buttons || [{ text: "OK", style: "default" }]);
  },

  // Info notifications
  info: (title, body, buttons) => {
    unifiedAlert(title, body, buttons || [{ text: "OK", style: "default" }]);
  },

  // Confirmation dialogs
  confirm: (
    title,
    body,
    onConfirm,
    onCancel,
    confirmText = "Confirm",
    cancelText = "Cancel",
  ) => {
    unifiedAlert(title, body, [
      { text: cancelText, style: "cancel", onPress: onCancel },
      { text: confirmText, style: "destructive", onPress: onConfirm },
    ]);
  },

  // Choice dialogs
  choice: (title, body, choices) => {
    unifiedAlert(title, body, choices);
  },

  // Input dialogs (SweetAlert only)
  prompt: (
    title,
    body,
    inputType = "text",
    defaultValue = "",
    onConfirm,
    onCancel,
  ) => {
    if (Platform.OS === "web" && typeof Swal !== "undefined") {
      Swal.fire({
        title,
        text: body,
        input: inputType,
        inputValue: defaultValue,
        showCancelButton: true,
        confirmButtonText: "OK",
        cancelButtonText: "Cancel",
        customClass: {
          popup: "sweetalert-popup",
          title: "sweetalert-title",
          content: "sweetalert-content",
          confirmButton: "sweetalert-confirm-button",
          cancelButton: "sweetalert-cancel-button",
        },
      }).then((result) => {
        if (result.isConfirmed && onConfirm) {
          onConfirm(result.value);
        } else if (onCancel) {
          onCancel();
        }
      });
    } else {
      // Fallback for native
      unifiedAlert(title, `${body}\n\n[Input: ${inputType}]`, [
        { text: "Cancel", style: "cancel", onPress: onCancel },
        {
          text: "OK",
          style: "default",
          onPress: () => onConfirm(defaultValue),
        },
      ]);
    }
  },

  // Toast-style notifications (SweetAlert only)
  toast: (title, body, icon = "success", duration = 3000) => {
    if (Platform.OS === "web" && typeof Swal !== "undefined") {
      Swal.fire({
        title,
        text: body,
        icon,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: duration,
        timerProgressBar: true,
        customClass: {
          popup: "sweetalert-toast",
          title: "sweetalert-toast-title",
          content: "sweetalert-toast-content",
        },
      });

      // Add toast styles if not already added
      if (!document.getElementById("sweetalert-toast-styles")) {
        const style = document.createElement("style");
        style.id = "sweetalert-toast-styles";
        style.textContent = `
          .sweetalert-toast {
            background: #1f2937;
            color: white;
            border-radius: 8px;
          }
          .sweetalert-toast-title {
            color: white;
            font-size: 1rem;
          }
          .sweetalert-toast-content {
            color: #d1d5db;
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      // Fallback for native
      unifiedAlert(title, body);
    }
  },
};
