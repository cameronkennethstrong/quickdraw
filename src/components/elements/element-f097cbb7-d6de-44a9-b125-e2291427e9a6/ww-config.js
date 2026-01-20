export default {
  editor: {
    label: { en: "Camera Canvas Preview" },
  },

  triggerEvents: [
    {
      name: "photo-taken",
      label: { en: "Photo taken" },
      event: {
        dataUrl: "",
        base64: "",
        mimeType: "",
        width: 0,
        height: 0,
        takenAt: "",
      },
    },
    {
      name: "photo-error",
      label: { en: "Photo error" },
      event: {
        message: "",
      },
    },
  ],

  properties: {
    takePhotoSignal: {
      label: { en: "Take photo signal" },
      type: "Text",
      defaultValue: "",
      bindable: true,
    },

    autoStart: {
      label: { en: "Auto start camera" },
      type: "OnOff",
      defaultValue: true,
    },
    facingMode: {
      label: { en: "Facing mode" },
      type: "Text",
      defaultValue: "environment",
    },
    mimeType: {
      label: { en: "Output mime type" },
      type: "Text",
      defaultValue: "image/jpeg",
    },
    quality: {
      label: { en: "JPEG/WebP quality (0-1)" },
      type: "Number",
      defaultValue: 0.9,
    },
    canvasHeight: {
      label: { en: "Canvas height" },
      type: "Text",
      defaultValue: "300px",
      bindable: true,
    },
  },
};
