<template>
  <div class="my-element">
    <!-- Hidden video source (must exist in DOM for reliable playback in some browsers) -->
    <video
      ref="video"
      autoplay
      playsinline
      muted
      style="position:absolute; left:-99999px; width:1px; height:1px; opacity:0;"
    ></video>

    <!-- Visible preview -->
    <canvas ref="canvas" :style="canvasStyle"></canvas>
  </div>
</template>

<script>
export default {
  props: {
    content: { type: Object, required: true },
  },

  data() {
    return {
      stream: null,
      rafId: null,
      isReady: false,
      lastSignal: null,
    };
  },

  computed: {
    canvasStyle() {
      return {
        width: "100%",
        height: this.content.canvasHeight || "300px",
        display: "block",
      };
    },
  },

  watch: {
    "content.takePhotoSignal": {
      immediate: false,
      async handler(val) {
        if (val == null || val === this.lastSignal) return;
        this.lastSignal = val;

        try {
          if (!this.stream || !this.isReady) {
            await this.startCamera();
          }

          const photo = await this.capturePhotoPayload();

          this.$emit("trigger-event", {
            name: "photo-taken",
            event: photo,
          });
        } catch (err) {
          this.$emit("trigger-event", {
            name: "photo-error",
            event: { message: err?.message || "Unknown error" },
          });
        }
      },
    },
  },

  async mounted() {
    if (this.content.autoStart !== false) {
      try {
        await this.startCamera();
      } catch (err) {
        this.$emit("trigger-event", {
          name: "photo-error",
          event: { message: err?.message || "Camera failed to start." },
        });
      }
    }

    this._onResize = () => this.syncCanvasResolution();
    window.addEventListener("resize", this._onResize);

    // Initial sync after layout
    setTimeout(() => this.syncCanvasResolution(), 0);
  },

  beforeUnmount() {
    window.removeEventListener("resize", this._onResize);
    this.stopCamera();
  },

  methods: {
    // Draw the camera frame into the canvas WITHOUT distortion ("cover" fit)
    drawCover(ctx, videoEl, dw, dh) {
      const sw = videoEl.videoWidth;
      const sh = videoEl.videoHeight;

      const scale = Math.max(dw / sw, dh / sh);
      const cw = dw / scale;
      const ch = dh / scale;
      const sx = (sw - cw) / 2;
      const sy = (sh - ch) / 2;

      ctx.clearRect(0, 0, dw, dh);
      ctx.drawImage(videoEl, sx, sy, cw, ch, 0, 0, dw, dh);
    },

    async startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("getUserMedia is not supported in this browser.");
      }

      this.stopCamera();

      const videoEl = this.$refs.video;
      if (!videoEl) throw new Error("Video element not found.");

      const facingMode = this.content.facingMode || "environment";

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode },
      });

      videoEl.srcObject = this.stream;

      await new Promise((resolve) => {
        if (videoEl.readyState >= 1) return resolve();
        videoEl.onloadedmetadata = () => resolve();
      });

      await videoEl.play().catch(() => {});

      this.isReady = true;

      this.syncCanvasResolution();
      this.startPreviewLoop();
    },

    stopCamera() {
      this.isReady = false;

      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }

      const videoEl = this.$refs.video;
      if (videoEl) videoEl.srcObject = null;

      if (this.stream) {
        this.stream.getTracks().forEach((t) => t.stop());
        this.stream = null;
      }
    },

    startPreviewLoop() {
      const canvas = this.$refs.canvas;
      const videoEl = this.$refs.video;
      if (!canvas || !videoEl) return;

      const ctx = canvas.getContext("2d");

      const draw = () => {
        if (!this.isReady) return;

        // Keep resolution in sync with layout (prevents blurry/odd scaling)
        this.syncCanvasResolution();

        const rect = canvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        if (w > 0 && h > 0 && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
          // ✅ "True to reality": preserve aspect ratio + crop instead of stretch
          this.drawCover(ctx, videoEl, w, h);
        }

        this.rafId = requestAnimationFrame(draw);
      };

      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.rafId = requestAnimationFrame(draw);
    },

    syncCanvasResolution() {
      const canvas = this.$refs.canvas;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));

      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;

      // Use CSS-pixel coordinate system for drawing
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },

    async capturePhotoPayload() {
      const canvas = this.$refs.canvas;
      if (!canvas) throw new Error("Canvas not found.");

      const mimeType = this.content.mimeType || "image/jpeg";
      const quality =
        typeof this.content.quality === "number" ? this.content.quality : 0.9;

      const dataUrl =
        mimeType === "image/png"
          ? canvas.toDataURL("image/png")
          : canvas.toDataURL(mimeType, quality);

      const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;

      const rect = canvas.getBoundingClientRect();

      return {
        dataUrl,
        base64,
        mimeType,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        takenAt: new Date().toISOString(),
      };
    },
  },
};
</script>

<style scoped>
.my-element {
  width: 100%;
}
.my-element canvas {
  width: 100%;
  display: block;
}
</style>
