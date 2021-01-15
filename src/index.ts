import 'leaflet/dist/leaflet.css';
import './index.css';
import L, {LatLngBounds, FeatureGroup} from 'leaflet';
import * as PIXI from 'pixi.js';
import 'leaflet-pixi-overlay';
// import data from './ls8_bbox.json';

let abortController;

async function getFeatures(xmin, ymin, xmax, ymax) {    
    const query = {query:
        `{
            getLs8(xmax: ${xmax}, xmin: ${xmin}, ymax: ${ymax}, ymin: ${ymin}) {
                nodes {
                    sceneid
                    geojson
                }
            }
        }`
    };    

    if (abortController) {
        abortController.abort();
    }

    abortController = new AbortController();
        
    const response = await fetch('http://localhost:3000/graphql', {
        method: 'POST',
        signal: abortController.signal,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
        },      
        body: JSON.stringify(query)
    });    

    const data = await response.json();
    const {data: {getLs8: {nodes}}} = data;
    return nodes.map(({geojson, sceneid}) => {
        return {type: 'Feature', geometry: geojson, properties: {sceneid}};
    });
}

let firstDraw = true;
let prevZoom;

// async function drawFeatures (map) {        
//     // const features = await getFeatures(map);
//     // const src = new Set(features.map(({properties: {sceneid}}) => sceneid));
//     // const dst = new Set();
//     // layers.eachLayer(layer => {
//     //     const [{feature}] = layer.getLayers();
//     //     const {properties: {sceneid}} = feature;
//     //     if(!src.has(sceneid)) {
//     //         layers.removeLayer(layer);
//     //     }
//     //     else {
//     //         dst.add(sceneid);
//     //     }                
//     // });
//     // features.forEach(f => {
//     //     const {properties: {sceneid}} = f;
//     //     if (!dst.has(sceneid)) {
//     //         layers.addLayer(L.geoJSON(f));
//     //     }
//     // });
// }

window.addEventListener('load', () => {
    const loader = new PIXI.Loader();
    loader.load((loader, resources) => {
        const map = L.map('map').setView([51.5, 80.0], 1);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        const graphics = new PIXI.Graphics();
        const pixiContainer = new PIXI.Container();
        pixiContainer.addChild(graphics);

        const pixiOverlay = L.pixiOverlay(async utils => {
            try {                
                const map = utils.getMap();
                const bounds = map.getBounds();
                const xmin = bounds.getWest();
                const xmax = bounds.getEast();
                const ymin = bounds.getSouth();
                const ymax = bounds.getNorth();                
                const container = utils.getContainer();
                const renderer = utils.getRenderer();
                const project = utils.latLngToLayerPoint;
                const scale = utils.getScale();

                // const features = await getFeatures(xmin, ymin, xmax, ymax);
                const response = await fetch('ls8_bbox.json');
                const data = await response.json();
                const {data: {getLs8: {nodes}}} = data;
                const features = nodes.map(({geojson, sceneid}) => {
                    return {type: 'Feature', geometry: geojson, properties: {sceneid}};
                });
                graphics.clear();
                graphics.lineStyle(3 / scale, 0x3388ff, 1);                                
                for (let f of features) {
                    const {geometry: {coordinates}} = f;
                    const [ring,] = coordinates;
                    const path = ring.map(([x,y]) => project(L.latLng(y, x)));
                    graphics.beginFill(0x3500FA, 1);
                    path.forEach((coords, index) => {
                        if (index == 0) {
                            graphics.moveTo(coords.x, coords.y);
                        }
                        else {
                            graphics.lineTo(coords.x, coords.y);
                        }
                    });
                    graphics.endFill();
                }
                renderer.render(container);
            }
            catch(e) {
                console.log(e);
            }
        }, pixiContainer, {doubleBuffering: true});
        pixiOverlay.addTo(map);
    });    
});