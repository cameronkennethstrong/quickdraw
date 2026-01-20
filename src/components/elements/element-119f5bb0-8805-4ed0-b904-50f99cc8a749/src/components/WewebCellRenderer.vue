<template>
  <div class="ww-cell-renderer" :class="{ pinned: isPinned }">
    <!-- If a container is provided, render it (both normal and pinned rows) -->
    <wwLayoutItemContext
      v-if="params?.containerId"
      :is-repeat="!isPinned"          
      :index="isPinned ? 0 : params.node?.sourceRowIndex"
      :data="exposedData"
    >
      <wwElement v-bind="params.containerId" class="ww-cell-renderer-flexbox" />
    </wwLayoutItemContext>

    <!-- Fallback: show text if no container was provided -->
    <div v-else class="ww-cell-renderer-fallback">
      {{ fallbackText }}
    </div>
  </div>
</template>

<script>
export default {
  props: ["params"],
  computed: {
    isPinned() {
      // You can also rely on params.isPinnedBottom if you passed that in
      return this.params?.node?.rowPinned === "bottom" || !!this.params?.isPinnedBottom;
    },
    exposedData() {
      // Everything your pinned/normal container might want to know
      return {
        value: this.params?.value,
        row: this.params?.data,
        colDef: this.params?.colDef,
        isPinnedBottom: this.isPinned,
        // optional aggregation or any extra info you pass via cellRendererParams
        agg: this.params?.agg,
        meta: this.params?.meta,
      };
    },
    fallbackText() {
      // When no container is set, show something sensible (especially for pinned rows)
      if (this.isPinned && typeof this.params?.value === "number") {
        // Example formatting; tailor as you like
        return this.params.value.toLocaleString();
      }
      return this.params?.value ?? "";
    },
  },
};
</script>

<style scoped lang="scss">
.ww-cell-renderer {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  line-height: normal;

  :deep(.ww-cell-renderer-flexbox) {
    flex: 1;
  }

  &.pinned {
    /* optional: give pinned cells a slightly different feel */
    opacity: 0.95;
  }

  .ww-cell-renderer-fallback {
    flex: 1;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
  }
}
</style>
