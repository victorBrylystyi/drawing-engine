import * as THREE from 'three'
import path from 'path-browserify'
import { LoaderIndicator } from '../components/Loader/LoaderIndicator'
import drawEngine from './drawEngine'


const app = () => {

    const assets = []

    const rootElement = document.querySelector('#root')
    const loadElement = new LoaderIndicator(rootElement)

    const textureLoader = new THREE.TextureLoader()
    const urls = [
        './assets/brush_1.png',
        './assets/brush_2.png',
        './assets/brush_3.png',
        './assets/brush_4.png',
        './assets/brush_5.png',
        './assets/brush_6.png',
        './assets/brush_7.png',
        './assets/brush_8.png',
        './assets/brush_9.png',
        './assets/brush_10.png',
        './assets/brush_11.png',
        './assets/brush_12.png',
        './assets/brush_13.png',
        './assets/brush_14.png',
        './assets/brush_15.png',
        './assets/brush_16.png',
    ]

    const goApp = () => {
        rootElement.removeChild( loadElement.holder )
        drawEngine(assets)
    }

    for (let i = 0; i < urls.length; i++) {
        new Promise((resolve, reject) => {
            textureLoader.load(
                urls[i],
                (texture) => {
                    texture.name = path.parse(urls[i]).name
                    // texture.minFilter = THREE.NearestFilter
                    // texture.magFilter = THREE.NearestFilter
                    texture.generateMipmaps = false
                    assets.push(texture)
                    if (assets.length === urls.length) goApp()
                },
                undefined,
                ( err ) => {
                    reject(err)
                    console.error( 'An error happened.' );
                }
            )
        })
    }
}

export default app


