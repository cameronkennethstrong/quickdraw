<template>
    <div v-if="!content.apiAccessToken.length" class="map-placeholder">
        <div class="placeholder-content">
            If you want to use a Mapbox map, you need a valid API access token. If you already have one, you can add it
            in the map settings. <br /><br />
            Otherwise you can find the token on your mapbox account page:
            <a href="https://account.mapbox.com/" target="_blank">
                <button>Mapbox account</button>
            </a>
        </div>
    </div>
    <div v-else-if="error" class="map-placeholder">
        <div class="placeholder-content">
            {{ error }}
        </div>
    </div>
    <div v-else :id="mapContainerId" :key="componentKey"></div>
</template>

<script>
import mapboxgl from 'mapbox-gl';
// Use local version because we have to replace every rbg() with rgba() version https://stackoverflow.com/a/71806296
import 'mapbox-gl/dist/mapbox-gl.css';

const DEFAULT_MARKERS_CONTENT_FIELD = 'content';
const DEFAULT_MARKERS_LAT_FIELD = 'lat';
const DEFAULT_MARKERS_LNG_FIELD = 'lng';
const DEFAULT_MARKERS_COLOR_FIELD = 'color';
const DEFAULT_MARKERS_DRAGGABLE_FIELD = 'draggable';
const DEFAULT_MARKERS_ICON_FIELD = 'icon';
const DEFAULT_MARKERS_HEIGHT_FIELD = 'height';
const DEFAULT_MARKERS_WIDTH_FIELD = 'width';

const DEFAULT_LAYERS_ID_FIELD = 'id';
const DEFAULT_LAYERS_TYPE_FIELD = 'type';
const DEFAULT_LAYERS_SOURCE_FIELD = 'source';
const DEFAULT_LAYERS_SOURCE_LAYER_FIELD = 'sourceLayer';
const DEFAULT_LAYERS_MINZOOM_FIELD = 'minZoom';
const DEFAULT_LAYERS_MAXZOOM_FIELD = 'maxZoom';
const DEFAULT_LAYERS_LAYOUT_FIELD = 'layout';
const DEFAULT_LAYERS_PAINT_FIELD = 'paint';
const DEFAULT_LAYERS_FILTER_FIELD = 'filter';
const DEFAULT_LAYERS_METADATA_FIELD = 'metadata';

const DEFAULT_SOURCES_ID_FIELD = 'id';
const DEFAULT_SOURCES_TYPE_FIELD = 'type';
const DEFAULT_SOURCES_URL_FIELD = 'url';
const DEFAULT_SOURCES_OPTIONS_FIELD = 'options';

import { computed, markRaw } from 'vue';

export default {
    props: {
        uid: { type: String, required: true },
        content: { type: Object, required: true },

    },
    emits: ['trigger-event', 'update:content:effect'],
    setup(props) {
        const center = computed(() => {
            const lng = Number(props.content.lng)
            const lat = Number(props.content.lat)
            return [isNaN(lng) ? 0 : lng, isNaN(lat) ? 0 : lat];
        })

        const { value: variableCenter, setValue: setCenter } = wwLib.wwVariable.useComponentVariable({
            uid: props.uid,
            name: 'center',
            type: 'object',
            defaultValue: {lng: center.value[0], lat: center.value[1]},
            readonly: true,
        });

        const { value: variableMap, setValue: setMap } = wwLib.wwVariable.useComponentVariable({
            uid: props.uid,
            name: 'instance',
            type: 'object',
            defaultValue: null,
            labelOnly: '{Map Instance}',
            preserveReference: true,
            readonly: true,
        });

        return {
            resizeObserver: null,
            map: null,
            markerInstances: [],
            componentKey: 0,
            center,
            variableCenter,
            setCenter,
            variableMap,
            setMap
        };
    },
    data() {
        return {
            mapContainerId: '',
            error: '',
        };
    },
    mounted() {
        this.mapContainerId = this.$el.id && this.$el.id!= '' ? this.$el.id : 'ww-mapbox-' + wwLib.wwUtils.getUid()

        if (window.__WW_IS_PRERENDER__) return;

        setTimeout(this.loadMap, 1);
    },
    computed: {
        mapStyle() {
            return this.content.mapStyle || this.content.styleUrl;
        },
        popupOptions() {
            return {
                closeButton: !this.content.popupHideCloseButton,
                closeOnClick: !this.content.popupStayOpenOnClick,
                closeOnMove: this.content.popupCloseOnMove,
                maxWidth:this.content.popupMaxWidth || '240px',
            }
        },
        markers() {
            const contentField = this.content.markersContentField || DEFAULT_MARKERS_CONTENT_FIELD;
            const latField = this.content.markersLatField || DEFAULT_MARKERS_LAT_FIELD;
            const lngField = this.content.markersLngField || DEFAULT_MARKERS_LNG_FIELD;
            const colorField = this.content.markersColorField || DEFAULT_MARKERS_COLOR_FIELD;
            const draggableField = this.content.markersDraggableField || DEFAULT_MARKERS_DRAGGABLE_FIELD;
            const iconField = this.content.markersIconField || DEFAULT_MARKERS_ICON_FIELD;
            const heightField = this.content.markersHeightField || DEFAULT_MARKERS_HEIGHT_FIELD;
            const widthField = this.content.markersWidthField || DEFAULT_MARKERS_WIDTH_FIELD;

            const data = wwLib.wwCollection.getCollectionData(this.content.markers);
            if (!Array.isArray(data)) return [];

            return data.map(marker => ({
                content: wwLib.resolveObjectPropertyPath(marker, contentField) || '',
                color: wwLib.resolveObjectPropertyPath(marker, colorField) || this.content.defaultMarkerColor || null,
                draggable:
                    wwLib.resolveObjectPropertyPath(marker, draggableField) ||
                    this.content.defaultMarkerDraggable ||
                    false,
                position: {
                    lat: Number(wwLib.resolveObjectPropertyPath(marker, latField) || 0),
                    lng: Number(wwLib.resolveObjectPropertyPath(marker, lngField) || 0),
                },
                icon: this.content.customMarker ? {
                    img: wwLib.resolveObjectPropertyPath(marker, iconField) || this.content.defaultMarkerIcon || null,
                    height: wwLib.resolveObjectPropertyPath(marker, heightField) || this.content.defaultMarkerHeight || 'auto',
                    width: wwLib.resolveObjectPropertyPath(marker, widthField) || this.content.defaultMarkerWidth || '40px'
                } : null,
                rawData: marker,
            }));
        },
        sources() {
            const sourcesIdField = this.content.sourcesIdField || DEFAULT_SOURCES_ID_FIELD;
            const sourcesTypeField = this.content.sourcesTypeField || DEFAULT_SOURCES_TYPE_FIELD;
            const sourcesOptionsField = this.content.sourcesOptionsField || DEFAULT_SOURCES_OPTIONS_FIELD;
            const sourcesUrlField = this.content.sourcesUrlField || DEFAULT_SOURCES_URL_FIELD;

            const data = wwLib.wwCollection.getCollectionData(this.content.sources);
            if (!Array.isArray(data)) return [];

            return data.map(source => ({
                id: wwLib.resolveObjectPropertyPath(source, sourcesIdField) || '',
                type: wwLib.resolveObjectPropertyPath(source, sourcesTypeField) || '',
                url: wwLib.resolveObjectPropertyPath(source, sourcesUrlField) || '',
                options: wwLib.resolveObjectPropertyPath(source, sourcesOptionsField) || {},
            }));
        },
        layers() {
            const layersIdField = this.content.layersIdField || DEFAULT_LAYERS_ID_FIELD;
            const layersTypeField = this.content.layersTypeField || DEFAULT_LAYERS_TYPE_FIELD;
            const layersSourceField = this.content.layersSourceField || DEFAULT_LAYERS_SOURCE_FIELD;
            const layersSourceLayerField = this.content.layersSourceLayerField || DEFAULT_LAYERS_SOURCE_LAYER_FIELD;
            const layersMinZoomField = this.content.layersMinZoomField || DEFAULT_LAYERS_MINZOOM_FIELD;
            const layersMaxZoomField = this.content.layersMaxZoomField || DEFAULT_LAYERS_MAXZOOM_FIELD;
            const layersLayoutField = this.content.layersLayoutField || DEFAULT_LAYERS_LAYOUT_FIELD;
            const layersPaintField = this.content.layersPaintField || DEFAULT_LAYERS_PAINT_FIELD;
            const layersFilterField = this.content.layersFilterField || DEFAULT_LAYERS_FILTER_FIELD;
            const layersMetadataField = this.content.layersMetadataField || DEFAULT_LAYERS_METADATA_FIELD;

            const data = wwLib.wwCollection.getCollectionData(this.content.layers);
            if (!Array.isArray(data)) return [];

            return data.map(layer => ({
                id: wwLib.resolveObjectPropertyPath(layer, layersIdField) || '',
                type: wwLib.resolveObjectPropertyPath(layer, layersTypeField) || '',
                source: wwLib.resolveObjectPropertyPath(layer, layersSourceField) || '',
                sourceLayer: wwLib.resolveObjectPropertyPath(layer, layersSourceLayerField) || '',
                minzoom: wwLib.resolveObjectPropertyPath(layer, layersMinZoomField) || 0,
                maxzoom: wwLib.resolveObjectPropertyPath(layer, layersMaxZoomField) || 24,
                layout: wwLib.resolveObjectPropertyPath(layer, layersLayoutField) || {},
                paint: wwLib.resolveObjectPropertyPath(layer, layersPaintField) || {},
                filter: wwLib.resolveObjectPropertyPath(layer, layersFilterField) || null,
                metadata: wwLib.resolveObjectPropertyPath(layer, layersMetadataField) || null,
            }));
        },
    },
    watch: {

        'content.apiAccessToken'(value) {
            if (!value) return;

            this.componentKey += 1;
            this.$nextTick(() => {
                this.loadMap();
            });
        },
        'content.zoom'(value) {
            if (!this.map) return;
            this.map.setZoom(value);
        },
        'content.mapProjection'(value) {
            if (!this.map) return;
            this.map.setProjection(value);
        },
        'content.fixedBounds'(value) {
            if (!this.map) return;
            if (value) this.fitMarkersBounds();
        },
        mapStyle(value) {
            if (!this.map) return;
            this.map.setStyle(value);
        },
        center(value) {
            if (!this.map) return;
            this.map.setCenter(value);
        },
        markers() {
            this.loadMarkers();
        },
        popupOptions() {
            this.loadMarkers();
        },
        sources(newSources, oldSources) {
            this.refreshSourcesAndLayers({ newSources, oldSources, newLayers: this.layers, oldLayers: this.layers });
        },
        layers(newLayers, oldLayers) {
            this.refreshSourcesAndLayers({ newLayers, oldLayers, newSources: this.sources, oldSources: this.sources });
        },
    },
    methods: {
        loadMap() {
            this.error = '';
            if (!this.content.apiAccessToken) return;
            mapboxgl.accessToken = this.content.apiAccessToken;
            const mapEl = document.getElementById(this.mapContainerId)
            if (this.map && this.resizeObserver) this.resizeObserver.unobserve(mapEl)
            if (mapEl) mapEl.innerHTML = '';
            this.map = new mapboxgl.Map({
                container: this.mapContainerId,
                style: this.mapStyle,
                center: this.center,
                zoom: this.content.zoom,
                projection: this.content.mapProjection,
                scrollZoom: this.content.scrollZoom,
                trackResize: this.content.trackResize,
                logoPosition: this.content.logoPosition,
                attributionControl: false,
            });
            this.setMap(markRaw(this.map))
            this.map.on('load', () => this.fireEvent('map:load'));
            this.map.on('render', () => this.fireEvent('map:render'));
            this.map.on('idle', () => this.fireEvent('map:idle'));
            this.map.on('style.load', () => {
                this.map.setFog({}); // Set the default atmosphere style
            });
            this.map.on('move', () => this.setCenter(this.map.getCenter()));
            this.map.on('click', this.handleMapClick);
            this.map.on('movestart', this.handleMapMove);
            this.map.on('moveend', this.handleMapMove);
            this.map.on('dragstart', this.handleMapMove);
            this.map.on('dragend', this.handleMapMove);
            this.loadMarkers();

            this.map.on('load', () => {
                this.refreshSourcesAndLayers({ newSources: this.sources, newLayers: this.layers });
            });
            this.map.on('error', event => {
                this.error = event.error;
            });

            this.resizeObserver = new ResizeObserver(() => {
                this.map && this.map.resize && this.map.resize();
                if (this.content.fixedBounds) this.fitMarkersBounds();
            });
            this.resizeObserver.observe(mapEl)

        },
        refreshSourcesAndLayers({ newSources = [], oldSources = [], newLayers = [], oldLayers = [] }) {
            if (!this.map) return;

            try {
                // We need to clear layers before sources
                for (const layer of oldLayers) {
                    if (!layer.id || !this.map.getLayer(layer.id)) continue;
                    this.map.removeLayer(layer.id);
                }

                for (const source of oldSources) {
                    if (!source.id || !this.map.getSource(source.id)) continue;
                    this.map.removeSource(source.id);
                }

                // We need to add sources before layers
                for (const source of newSources) {
                    if (!source.id) continue;
                    this.map.addSource(source.id, this.formatSource(source));
                }

                for (const layer of newLayers) {
                    if (!layer.id) continue;
                    this.map.addLayer(this.formatLayer(layer));
                }
            } catch (error) {
                wwLib.wwLog.warn('WW-MAPBOX FAILED TO REFRESH SOURCES AND LAYERS', error);
            }
        },
        loadMarkers() {
            if (!this.map) return;

            // Clear markers
            for (const marker of this.markerInstances) {
                marker.remove();
            }

            for (const marker of this.markers) {
                const el = document.createElement('img');
                el.className = 'marker';
                el.src = this.formatUrl(marker.icon?.img);
                el.style.width = marker.icon?.width;
                el.style.height = marker.icon?.height;
                const _marker = new mapboxgl.Marker({
                    color: marker.color,
                    draggable: marker.draggable,
                    element: marker.icon ? el : undefined
                })
                    .setLngLat([marker.position.lng, marker.position.lat])
                    .addTo(this.map);
                if (marker.content && !this.content.disablePopups) _marker.setPopup(new mapboxgl.Popup({...this.popupOptions}).setHTML(marker.content))

                _marker.getElement().addEventListener('click', (e) => this.handleMarkerClick(marker, e));
                _marker.getElement().addEventListener('mouseenter', (e) => this.handleMarkerMouseover(marker, e));
                _marker.getElement().addEventListener('mouseleave', (e) => this.handleMarkerMouseout(marker, e));
                _marker.on('dragstart', event => this.handleMarkerDrag(marker, event));
                _marker.on('drag', event => this.handleMarkerDrag(marker, event));
                _marker.on('dragend', event => this.handleMarkerDrag(marker, event));


                this.markerInstances.push(_marker);
            }

            if (this.content.fixedBounds) this.fitMarkersBounds();
        },
        fitMarkersBounds() {
            if (!this.map || !this.markers.length) return;
            // Apply a default zoom if there is only one marker
            if(this.markers.length === 1) {
                this.map.flyTo({center: this.markers[0].position, zoom: this.content.zoom})
                return
            }
            const baseBounds = new mapboxgl.LngLatBounds(
                [this.markers[0].position.lng, this.markers[0].position.lat],
                [this.markers[0].position.lng, this.markers[0].position.lat]
            );
            const bounds = this.markers.reduce((bounds, marker) => {
                return bounds.extend([marker.position.lng, marker.position.lat]);
            }, baseBounds);

            this.map.fitBounds(bounds, { padding: 20 });
        },
        handleMarkerClick(marker, domEvent) {
            this.$emit('trigger-event', {
                name: 'marker:click',
                event: { marker, domEvent },
            });
        },
        handleMarkerMouseover(marker, domEvent) {
            this.$emit('trigger-event', {
                name: 'marker:mouseover',
                event: { marker, domEvent },
            });
        },
        handleMarkerMouseout(marker, domEvent) {
            this.$emit('trigger-event', {
                name: 'marker:mouseout',
                event: { marker, domEvent },
            });
        },
        handleMarkerDrag(marker, event) {
            this.$emit('trigger-event', {
                name: 'marker:' + event.type,
                event: { marker, lngLat: event.target._lngLat },
            });
        },
        handleMapMove(event) {
            this.$emit('trigger-event', {
                name: 'map:' + event.type,
                event: { lngLat: this.map.getCenter() },
            });
        },
        handleMapClick(event) {
            this.$emit('trigger-event', {
                name: 'map:click',
                event: { ...event, domEvent: event.originalEvent },
            });
        },
        formatSource(source) {
            const _source = { ...source, ...(source.options || null) };
            delete _source.id;
            delete _source.options;
            if (['geojson', 'video'].includes(_source.type)) delete _source.url;
            return _source;
        },
        formatUrl(url) {
            if(typeof url !== 'string') return null
            return url.startsWith('designs/') ? `${wwLib.wwUtils.getCdnPrefix()}${url}` : `${url}`
        },
        formatLayer(layer) {
            const _layer = { ...layer };
            if (!_layer.filter) delete _layer.filter;
            
            // Transform sourceLayer to source-layer (Mapbox expects kebab-case)
            if (_layer.sourceLayer) {
                _layer['source-layer'] = _layer.sourceLayer;
                // delete _layer.sourceLayer; Keep _layer.sourceLayer for now to avoid breaking changes
            }
            
            return _layer;
        },
        fireEvent(eventName) {
            this.$emit('trigger-event', {
                name: eventName,
                event: null,
            });
        },

    },
};
</script>

<style scoped>
.map-placeholder {
    overflow: hidden;
    z-index: 2;
    position: absolute;
    top: 0px;
    left: 0px;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.4);

    .placeholder-content {
        text-align: center;
        width: 90%;
        background: white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0.8em 1.2em;
        border-radius: 12px;

        .wrongKey {
            color: #f44336;
            padding: 10px;
        }

        button {
            margin-top: 20px;
            padding: 0.8em 1.2em;
            border: none;
            border-radius: 12px;
            background-color: #099af2;
            color: white;
            font-weight: 500;
            font-size: 1.1em;
            transition: 0.3s;

            &:hover {
                cursor: pointer;
                background-color: #077ac0;
                transition: 0.3s;
            }
        }
    }
}
</style>
