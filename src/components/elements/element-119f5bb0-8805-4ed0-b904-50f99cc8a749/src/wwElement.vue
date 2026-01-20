<template>
  <div class="ww-datagrid" :class="{ editing: isEditing }" :style="cssVars">
    <ag-grid-vue
      :rowData="rowData"
      :columnDefs="columnDefs"
      :defaultColDef="defaultColDef"
      :domLayout="content.layout === 'auto' ? 'autoHeight' : 'normal'"
      :style="style"
      :rowSelection="rowSelection"
      :selection-column-def="{ pinned: true }"
      :theme="theme"
      :getRowId="getRowId"
      :pagination="content.pagination"
      :paginationPageSize="content.paginationPageSize || 10"
      :paginationPageSizeSelector="false"
      :suppressMovableColumns="!content.movableColumns"
      :columnHoverHighlight="content.columnHoverHighlight"
      :locale-text="localeText"
      :pinnedBottomRowData="pinnedBottomRowData"
      :getRowStyle="getRowStyle"
      @grid-ready="onGridReady"
      @row-selected="onRowSelected"
      @selection-changed="onSelectionChanged"
      @cell-value-changed="onCellValueChanged"
      @filter-changed="onFilterChanged"
      @sort-changed="onSortChanged"
      @row-clicked="onRowClicked"
    >
    </ag-grid-vue>
  </div>
</template>

<script>
import { shallowRef, watchEffect, computed } from "vue";
import { AgGridVue } from "ag-grid-vue3";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
} from "ag-grid-community";
import {
  AG_GRID_LOCALE_EN,
  AG_GRID_LOCALE_FR,
  AG_GRID_LOCALE_DE,
  AG_GRID_LOCALE_ES,
  AG_GRID_LOCALE_PT,
} from "@ag-grid-community/locale";
import ActionCellRenderer from "./components/ActionCellRenderer.vue";
import ImageCellRenderer from "./components/ImageCellRenderer.vue";
import WewebCellRenderer from "./components/WewebCellRenderer.vue";

console.log("AG Grid version:", AG_GRID_LOCALE_FR);

// TODO: maybe register less modules
// TODO: maybe register modules per grid instead of globally
ModuleRegistry.registerModules([AllCommunityModule]);

export default {
  components: {
    AgGridVue,
    ActionCellRenderer,
    ImageCellRenderer,
    WewebCellRenderer,
  },
  props: {
    content: {
      type: Object,
      required: true,
    },
    uid: {
      type: String,
      required: true,
    },
  },
  emits: ["trigger-event", "update:content:effect"],
  setup(props, ctx) {
    const { resolveMappingFormula } = wwLib.wwFormula.useFormula();

    const gridApi = shallowRef(null);
    const { value: selectedRows, setValue: setSelectedRows } =
      wwLib.wwVariable.useComponentVariable({
        uid: props.uid,
        name: "selectedRows",
        type: "array",
        defaultValue: [],
        readonly: true,
      });
    const { value: filterValue, setValue: setFilters } =
      wwLib.wwVariable.useComponentVariable({
        uid: props.uid,
        name: "filters",
        type: "object",
        defaultValue: {},
        readonly: true,
      });
    const { value: sortValue, setValue: setSort } =
      wwLib.wwVariable.useComponentVariable({
        uid: props.uid,
        name: "sort",
        type: "object",
        defaultValue: {},
        readonly: true,
      });

    const onGridReady = (params) => {
      gridApi.value = params.api;
    };

    watchEffect(() => {
      if (!gridApi.value) return;
      if (props.content.initialFilters) {
        gridApi.value.setFilterModel(props.content.initialFilters);
      }
      if (props.content.initialSort) {
        gridApi.value.applyColumnState({
          state: props.content.initialSort || [],
          defaultState: { sort: null },
        });
      }
    });

    const onRowSelected = (event) => {
      const name = event.node.isSelected() ? "rowSelected" : "rowDeselected";
      ctx.emit("trigger-event", {
        name,
        event: { row: event.data },
      });
    };

    const onSelectionChanged = (event) => {
      if (!gridApi.value) return;
      const selected = gridApi.value.getSelectedRows() || [];
      setSelectedRows(selected);
    };

    const onFilterChanged = (event) => {
      if (!gridApi.value) return;
      const filterModel = gridApi.value.getFilterModel();
      if (
        JSON.stringify(filterModel || {}) !==
        JSON.stringify(filterValue.value || {})
      ) {
        setFilters(filterModel);
        ctx.emit("trigger-event", {
          name: "filterChanged",
          event: filterModel,
        });
      }
    };

    const onSortChanged = (event) => {
      if (!gridApi.value) return;
      const state = gridApi.value.getState();
      if (
        JSON.stringify(state.sort?.sortModel || []) !==
        JSON.stringify(sortValue.value || [])
      ) {
        setSort(state.sort?.sortModel || []);
        ctx.emit("trigger-event", {
          name: "sortChanged",
          event: state.sort?.sortModel || [],
        });
      }
    };


    return {
      resolveMappingFormula,
      onGridReady,
      onRowSelected,
      onSelectionChanged,
      gridApi,
      onFilterChanged,
      onSortChanged,
      localeText: computed(() => {
        switch (props.content.lang) {
          case "fr":
            return AG_GRID_LOCALE_FR;
          case "de":
            return AG_GRID_LOCALE_DE;
          case "es":
            return AG_GRID_LOCALE_ES;
          case "pt":
            return AG_GRID_LOCALE_PT;
          case "custom":
            return {
              ...AG_GRID_LOCALE_EN,
              ...(props.content.localeText || {}),
            };
          default:
            AG_GRID_LOCALE_EN;
        }
      }),
    };
  },
  computed: {
    pinnedBottomRowData() {
      const data = wwLib.wwUtils.getDataFromCollection(this.content.pinnedBottomRows);
      return Array.isArray(data) ? data : [];
    },
    rowData() {
      const data = wwLib.wwUtils.getDataFromCollection(this.content.rowData);
      return Array.isArray(data) ? data ?? [] : [];
    },
    defaultColDef() {
      return {
        editable: false,
        resizable: this.content.resizableColumns,
      };
    },
    columnDefs() {
      return this.content.columns.map((col) => {
        const minWidth =
          !col.minWidth || col.minWidth === "auto"
            ? null
            : wwLib.wwUtils.getLengthUnit(col.minWidth)?.[0];
        const maxWidth =
          !col.maxWidth || col.maxWidth === "auto"
            ? null
            : wwLib.wwUtils.getLengthUnit(col.maxWidth)?.[0];
        const width =
          !col.width || col.width === "auto" || col.widthAlgo === "flex"
            ? null
            : wwLib.wwUtils.getLengthUnit(col.width)?.[0];
        const flex = col.widthAlgo === "flex" ? col.flex ?? 1 : null;
        const commonProperties = {
          minWidth,
          maxWidth,
          pinned: col.pinned === "none" ? false : col.pinned,
          width,
          flex,
          hide: !!col.hide,
        };
        // NEW — resolve alignment for this column
        const align = this.resolveAlign(col.align || 'auto', col);
        const { cellClass, headerClass } = this.alignmentClasses(align, col.headerAlign);
        switch (col.cellDataType) {
          case "action": {
            return {
              ...commonProperties,
              headerName: col.headerName,
              cellRenderer: "ActionCellRenderer",
              cellRendererParams: {
                name: col.actionName,
                label: col.actionLabel,
                trigger: this.onActionTrigger,
                withFont: !!this.content.actionFont,
              },
              sortable: false,
              filter: false,
            };
          }
          case "custom":
            return {
              ...commonProperties,
              headerName: col.headerName,
              field: col.field,
              cellRenderer: "WewebCellRenderer",
              cellRendererParams: (params) => {
                const isPinned = params.node.rowPinned === 'bottom';
                return {
                  containerId: isPinned
                    ? (col.pinnedBottomContainerId || col.containerId)
                    : col.containerId,
                  isPinnedBottom: isPinned,
                  value: params.value,
                  rowData: params.data,
                  colDef: params.colDef,
                };
              },
              sortable: col.sortable,
              filter: col.filter,
              cellClassRules: {
                'no-highlight': () => true,
                'pinned-bottom-cell': (params) => params.node.rowPinned === 'bottom',
              },
            };
          case "image": {
            return {
              ...commonProperties,
              headerName: col.headerName,
              field: col.field,
              cellRenderer: "ImageCellRenderer",
              cellRendererParams: {
                width: col.imageWidth,
                height: col.imageHeight,
              },
            };
          }
          default: {
            const result = {
              ...commonProperties,
              headerName: col.headerName,
              field: col.field,
              sortable: col.sortable,
              filter: col.filter,
              editable: (params) => params.node.rowPinned !== 'bottom' && col.editable,
            };
            if (col.useCustomLabel) {
              result.valueFormatter = (params) => {
                return this.resolveMappingFormula(
                  col.displayLabelFormula,
                  params.value
                );
              };
            }
            return result;
          }
        }
      });
    },
    rowSelection() {
      if (this.content.rowSelection === "multiple") {
        return {
          mode: "multiRow",
          checkboxes: !this.content.disableCheckboxes,
          headerCheckbox: !this.content.disableCheckboxes,
          selectAll: this.content.selectAll || "all",
          enableClickSelection: this.content.enableClickSelection,
        };
      } else if (this.content.rowSelection === "single") {
        return {
          mode: "singleRow",
          checkboxes: !this.content.disableCheckboxes,
          enableClickSelection: this.content.enableClickSelection,
        };
      } else {
        return {
          mode: "singleRow",
          checkboxes: false,
          isRowSelectable: () => false,
          enableClickSelection: this.content.enableClickSelection,
        };
      }
    },
    style() {
      if (this.content.layout === "auto") return {};
      return {
        height: this.content.height || "400px",
      };
    },
    cssVars() {
      return {
        "--ww-data-grid_action-backgroundColor":
          this.content.actionBackgroundColor,
        "--ww-data-grid_action-color": this.content.actionColor,
        "--ww-data-grid_action-padding": this.content.actionPadding,
        "--ww-data-grid_action-border": this.content.actionBorder,
        "--ww-data-grid_action-borderRadius": this.content.actionBorderRadius,
        ...(this.content.actionFont
          ? { "--ww-data-grid_action-font": this.content.actionFont }
          : {
              "--ww-data-grid_action-fontSize": this.content.actionFontSize,
              "--ww-data-grid_action-fontFamily": this.content.actionFontFamily,
              "--ww-data-grid_action-fontWeight": this.content.actionFontWeight,
              "--ww-data-grid_action-fontStyle": this.content.actionFontStyle,
              "--ww-data-grid_action-lineHeight": this.content.actionLineHeight,
            }),
      };
    },
    theme() {
      return themeQuartz.withParams({
        headerBackgroundColor: this.content.headerBackgroundColor,
        headerTextColor: this.content.headerTextColor,
        headerFontSize: this.content.headerFontSize,
        headerFontFamily: this.content.headerFontFamily,
        headerFontWeight: this.content.headerFontWeight,
        borderColor: this.content.borderColor,
        wrapperBorder: false,
        wrapperBorderRadius: 0,
        rowBorder: {
          style: 'solid',
          width: 1,
          color: '#737373', 
        },
        cellTextColor: this.content.cellColor,
        cellFontFamily: this.content.cellFontFamily,
        dataFontSize: this.content.cellFontSize,
        oddRowBackgroundColor: this.content.rowAlternateColor,
        backgroundColor: this.content.rowBackgroundColor,
        rowHoverColor: this.content.rowHoverColor,
        selectedRowBackgroundColor: this.content.selectedRowBackgroundColor,
        rowVerticalPaddingScale: this.content.rowVerticalPaddingScale || 1,
        menuBackgroundColor: this.content.menuBackgroundColor,
        menuTextColor: this.content.menuTextColor,
        columnHoverColor: this.content.columnHoverColor,
        foregroundColor: this.content.textColor,
        checkboxCheckedBackgroundColor: this.content.selectionCheckboxColor,
        rangeSelectionBorderColor: this.content.cellSelectionBorderColor,
        checkboxUncheckedBorderColor: this.content.checkboxUncheckedBorderColor,
        focusShadow: this.content.focusShadow?.length
          ? this.content.focusShadow
          : undefined,
      });
    },
    isEditing() {
      // eslint-disable-next-line no-unreachable
      return false;
    },
  },
  methods: {
    // NEW — infer/resolve alignment and map to AG Grid classes
    resolveAlign(align, col) {
      // explicit value wins
      if (align && align !== 'auto') return align;

      // infer from declared type first
      const t = (col.cellDataType || '').toLowerCase();
      if (t.includes('number') || t === 'currency' || t === 'percent') return 'right';
      if (t.includes('date') || t.includes('time')) return 'center';

      // sample first non-null value in current data
      const first = (this.rowData || []).find(
        r => r && r[col.field] !== null && r[col.field] !== undefined
      );
      const v = first ? first[col.field] : undefined;
      if (typeof v === 'number') return 'right';
      if (v instanceof Date) return 'center';

      // default
      return 'left';
    },
    alignmentClasses(align, headerAlign) {
      const header = headerAlign && headerAlign !== 'auto' ? headerAlign : align;

      const cellClass =
        align === 'right'
          ? 'ag-right-aligned-cell'
          : align === 'center'
          ? 'ag-center-aligned-cell'
          : 'ag-left-aligned-cell';

      const headerClass =
        header === 'right'
          ? 'ag-right-aligned-header'
          : header === 'center'
          ? 'ag-center-aligned-header'
          : 'ag-left-aligned-header';

      return { cellClass, headerClass };
    },
    getRowStyle(params) {
      if (params.node.rowPinned === 'bottom') {
        return {
          backgroundColor: this.content.pinnedRowBackground || '#f5f5f5',
          color: this.content.pinnedRowTextColor || '#000',
          fontWeight: this.content.pinnedRowBold ? 'bold' : 'normal',
        };
      }
      return null;
    },
    getRowId(params) {
      return this.resolveMappingFormula(this.content.idFormula, params.data);
    },
    onActionTrigger(event) {
      this.$emit("trigger-event", {
        name: "action",
        event,
      });
    },
    onCellValueChanged(event) {
      this.$emit("trigger-event", {
        name: "cellValueChanged",
        event: {
          oldValue: event.oldValue,
          newValue: event.newValue,
          columnId: event.column.getColId(),
          row: event.data,
        },
      });
    },
    onRowClicked(event) {
      this.$emit("trigger-event", {
        name: "rowClicked",
        event: {
          row: event.data,
          id: event.node.id,
          index: event.node.sourceRowIndex,
          displayIndex: event.rowIndex,
        },
      });
    },
  },
};
</script>

<style scoped lang="scss">
.ww-datagrid {
  position: relative;
}
:global(.ag-cell.no-highlight),
:global(.ag-cell.no-highlight:focus),
:global(.ag-cell.no-highlight:focus-within),
:global(.ag-cell.no-highlight.ag-cell-focus) {
  background-color: transparent !important;
  box-shadow: none !important;
  outline: none !important;
  border: none !important;
  border-color: transparent !important;
}

:global(.ag-cell.no-highlight .ag-cell-wrapper),
:global(.ag-cell.no-highlight .ag-cell-value) {
  background: transparent !important;
  outline: none !important;
}

:global(.ag-cell.pinned-bottom-cell) {
  border-top: 1px solid var(--ag-border-color, #C8C9D0);
  font-size: 0.95em;
  opacity: 0.95;
}

</style>
