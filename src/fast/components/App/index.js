

import * as THREE from 'three'

import { GUI } from 'dat.gui'
import Stats from 'three/examples/jsm/libs/stats.module'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import Engine from '../DrawingEngine'
// import Store from '../App/Strore'
import { BehaviorSubject, distinct, fromEvent, map, pairwise } from 'rxjs'
import { MathUtils } from 'three'
import savedStore from '../../store.json'
import fs from 'fs'

class App {

    gui = new GUI()
    stats = new Stats()
    viewMode = false
    canvasList = []

    activeCanva = new BehaviorSubject(null)

    store = new BehaviorSubject({
        future:[],
        paste:[],
        currentState:{
            engineLayers:[],
        },
        assetsNames:[],
        assetsPasses:[],
    })

    layer = new BehaviorSubject({
        name: null,
        id: null,
        strokes:[],
        position: null,
        scale: null,
    })

    constructor (assets, rootElement, urls){
        this.rootElement = rootElement
        this.assets = assets
        this.gui.width =  290
        window.$r = this.store

        this.store
        .pipe(
            distinct()
        )
        .subscribe(state => console.log('newIntStore', state))

        this.store
        .next({
            ...this.store.value,
            assetsPasses:[...urls]
        })

        this.store
        .next({
            ...this.store.value,
            assetsNames: [...assets.map( texture => texture.name )]
        })

        this.init(assets)
        this.ui()
        this.addGui()
        this.render()

        this.layer
        .subscribe(state => {
            if(state.id){
                this.store
                .next({
                    ...this.store.value,
                    paste:[...this.store.value.paste, {...this.store.value.currentState}],
                    currentState: {
                        ...this.store.value.currentState,
                        engineLayers: [...this.store.value.currentState.engineLayers, {...state}] 
                    }
                })
            }
        })

        this.store
        .pipe(
            map(state => state.currentState.engineLayers),
            distinct()
        )
        .subscribe(engineLayers => {
            this.eng.engineStore
            .next({
                ...this.eng.engineStore.value,
                layers: [...engineLayers]
            })
        })

        this.eng.engineStore
        .pipe(
            map(state => state.layers),
            distinct()
        )
        .subscribe(layers => {
            for (let i=0; i< layers.length; i++){
                if(!this.canvasList.find(canvaUi => canvaUi.id === layers[i].id)){
                    this.addCanvaUi(this.eng.getCanvaById(layers[i].id))
                } 
            }
        })

        this.activeCanva
        .pipe(
            pairwise()
        )
        .subscribe(state => {
            const [paste, current] = state

            if(current !== paste){
                this.eng.engineStore
                .next({
                    ...this.eng.engineStore.value,
                    activeLayer: current
                })
            }
        })
    }

    addCanvaUi(canvaInstance){

        if ( this.canvasList.length < 5 ){

            const config = {
                id: null,
                name: null,
                domElement: null,
                gui: null,
                param: null
            }

            const newCanvaUi = document.createElement('div')
            newCanvaUi.id = 'canva'
            config.domElement = newCanvaUi

            this.canvasList.push(config)

            const textContent =  canvaInstance.name
            config.name = textContent
            config.id = canvaInstance.userData.id

            const canva = canvaInstance// this.eng.createNewCanva(textContent)

            config.param = {
                visible: canva.visible,
                attached: canva.isAttachToCamera,
                translate: canva.translateZValue
            }

            const buttonActive = document.createElement('button')
            buttonActive.textContent = textContent
            buttonActive.id = 'activeButton'
            buttonActive.name = config.id
            // buttonActive.config = config


            const settings = document.createElement('div')
            settings.id = 'settings'

            const gui = new GUI()
            config.gui = gui
            gui.name = textContent
            gui.width = 188


            gui.add(config.param,'visible')
            .onChange((v) => this.eng.setVisibleCanvaByName(gui.name, v))

            gui.add(config.param,'attached')
            .onChange((v) => {
                this.eng.setAttachToCameraActiveCanva(v)
                if (!v) gui.__controllers[gui.__controllers.findIndex(controllers => controllers.property === 'translate')].domElement.style.display = 'none'
                if (v) gui.__controllers[gui.__controllers.findIndex(controllers => controllers.property === 'translate')].domElement.style.display = 'block'
            })

            gui.add(config.param,'translate',0,1,0.01)
            .onChange((v)=>{
                this.eng.setTranslateActiveCanva(v)
            })

            settings.appendChild(gui.domElement)

            fromEvent(buttonActive, 'click')
            .subscribe(e => {

                if (this.eng.activeCanva){

                    const currentCanvaId = this.eng.activeCanva.userData.id
                    const currentConfig =  this.canvasList.find( config => config.id === currentCanvaId)
                    const currentCanva =  currentConfig.domElement
                    const button = currentCanva.children.activeButton
                
                    button.style.backgroundColor = '#d8dbdc'
                    currentConfig.gui.__controllers[currentConfig.gui.__controllers.findIndex(controllers => controllers.property === 'attached')].domElement.style.display = 'none'
                    currentConfig.gui.__controllers[currentConfig.gui.__controllers.findIndex(controllers => controllers.property === 'translate')].domElement.style.display = 'none'
                    // currentConfig.gui.remove(currentConfig.gui.__controllers[currentConfig.gui.__controllers.findIndex(controllers => controllers.property === 'attached')])
                    // currentConfig.gui.remove(currentConfig.gui.__controllers[currentConfig.gui.__controllers.findIndex(controllers => controllers.property === 'translate')])

                    // убрать
                }

                e.target.style.backgroundColor = '#76ca67'

                this.activeCanva
                .next(e.target.name )

                // this.store
                // .next({
                //     ...this.store.value,
                //     paste:[...this.store.value.paste, {...this.store.value.currentState}],
                //     currentState:{
                //         ...this.store.value.currentState,
                //         activeCanva: e.target.name  
                //     }
                // })

                const targetConfig = this.canvasList.find( config => config.id === e.target.name)
                targetConfig.gui.__controllers[targetConfig.gui.__controllers.findIndex(controllers => controllers.property === 'attached')].domElement.style.display = 'block'
                targetConfig.gui.__controllers[targetConfig.gui.__controllers.findIndex(controllers => controllers.property === 'translate')].domElement.style.display = 'block'
            })

            newCanvaUi.appendChild(buttonActive) 
            newCanvaUi.appendChild(settings)
            
            this.canvasListUi.appendChild(newCanvaUi)
        }

    }

    ui(){

        this.canvasListUi = document.querySelector('#canvasList')

        fromEvent(document.querySelector('.noneDiv'), 'click')
        .subscribe((event) => {
            const currentCanvaId = this.eng.activeCanva.userData.id
            const currentConfig =  this.canvasList.find( config => config.id === currentCanvaId)
            const currentCanva =  currentConfig.domElement
            currentCanva.children.activeButton.style.backgroundColor = '#d8dbdc'
            // currentConfig.gui.remove(currentConfig.gui.__controllers[currentConfig.gui.__controllers.findIndex(controllers => controllers.property === 'attached')])
            // currentConfig.gui.remove(currentConfig.gui.__controllers[currentConfig.gui.__controllers.findIndex(controllers => controllers.property === 'translate')])

            currentConfig.gui.__controllers[currentConfig.gui.__controllers.findIndex(controllers => controllers.property === 'attached')].domElement.style.display = 'none'
            currentConfig.gui.__controllers[currentConfig.gui.__controllers.findIndex(controllers => controllers.property === 'translate')].domElement.style.display = 'none'

            this.activeCanva
            .next(null)

        })

        fromEvent(document.querySelector('.addButton'),'click')
        .subscribe(() => {
            if (this.store.value.currentState.engineLayers.length < 5){

                this.layer
                .next({
                    ...this.layer.value,
                    name: `Canva ${this.store.value.currentState.engineLayers.length + 1}`,
                    id: MathUtils.generateUUID(),
                })

            }
        })

        fromEvent(document.querySelector('.deleteButton'), 'click')
        .subscribe(() => {

        })

        fromEvent(document.querySelector('.undo'), 'click')
        .subscribe(() => {
            // const store = this.store.getValue()
            // const newCurrentState = store.paste[store.paste.length-1]
        })

        fromEvent(document.querySelector('.redo'), 'click')
        .subscribe(() => {

        })



        fromEvent(document.querySelector('.save'), 'click')
        .subscribe(() => {

            // const newPath = '../../store.json'

            // try {
            //     fs.writeFileSync(newPath, JSON.stringify(this.store.getValue()))
            // } catch (err) {
            //     console.error(err)
            // }
        })

        fromEvent(document.querySelector('.restore'), 'click')
        .subscribe(() => {
            // console.log(savedStore)
            this.store
            .next(savedStore)
        })



    }

    init(assets){

        const app = document.querySelector('#app')
        app.appendChild( this.stats.dom )

        this.w = this.rootElement.clientWidth
        this.h = this.rootElement.clientHeight

        this.canvas = document.createElement('canvas')
        this.canvas.width = this.w
        this.canvas.height = this.h

        // this.canvas.offsetWidth
        
        this.rootElement.appendChild(this.canvas)

        this.renderer = new THREE.WebGLRenderer({
            canvas:this.canvas,
            antialias:false,
            alpha:true,
            premultipliedAlpha: false
        })

        this.renderer.setSize(this.w, this.h)
        this.renderer.setPixelRatio(window.devicePixelRatio)

        this.scene = new THREE.Scene()
        // this.sceneCursor = new THREE.Scene()

        this.camera = new THREE.PerspectiveCamera( 70, this.w / this.h, 0.01, 10 )
        this.camera.position.z = 1

        this.scene.add(this.camera)

        this.scene.background = new THREE.Color(0xe6e8e8)

        this.controls = new OrbitControls(this.camera,this.renderer.domElement)
        this.controls.maxDistance = 0
        this.controls.maxDistance = 1.1
        this.controls.enabled = false

        this.box1 = new THREE.Mesh( new THREE.BoxGeometry( 0.2, 0.2, 0.2 ), new THREE.MeshNormalMaterial() )
        this.box1.position.set(0,0,0)

        this.scene.add(this.box1)

        this.saveCamera()

        this.eng = new Engine({
            renderer:this.renderer,
            canvas:this.canvas,
            appRef:this,
            brushAssets:assets,
        })

        this.eng.addEventListener('change', (value)=>{
            console.log('dispatch', value.payload)
            // if redux - dispatch 
            this.store.next({
                ...this.store.value,
                paste:[...this.store.value.paste, {...this.store.value.currentState}],
                currentState:{
                    ...this.store.value.currentState,
                    engineLayers: value.payload.layers
                }
            }) 
        } )


        this.scene.add(this.eng)

        console.log(this.eng)

        // const loader = new THREE.ObjectLoader()
        // const cameraPDef = this.camera.toJSON()
        // this.parseCamera = loader.parse(cameraPDef)

        // this.camera.attach(this.resultPlane)
        // this.camera.attach(this.tempResulpPlane)

        // // this.renderer.setRenderTarget(this.drawingEngine.rt)
        // // this.renderer.setClearColor(new THREE.Color(0x000000), 0)
        // // this.renderer.clearColor()
        // // this.renderer.setRenderTarget(null)
        // // this.drawingEngine.renderUp() 
        // this.drawingEngine.setCleanScreen()


        this.params = {
                'Visible canvases': true,
                'Brush Color': 0x000000,
                'Clear active canva': () => {
                    this.eng.setCleanScreenActiveLayer()
                },
                'Brush shape': 'brush_1',
                'Grain': 'grain_1',
                'Opacity': 1.0,
                'Brush size': this.eng.defBrushSize,
                'Mode': 'Drawing',
                'Scene color':  this.scene.background.getHex(), 
                'Canvas View':  () => {
                    this.setCameraToDef()
                },
                // 'Attach to camera': true,
                'Pressure settings':{
                    pressureBleed: 1.0,
                    pressure: 0.5,
                    pressureOpacity:1.0,
                    nodeOpacityScale:1.0,
                    tilt:0.0,
                    tiltOpacity:1.0,
                    adjust:false,
                },
        }


    }

    setCameraToDef(){
        this.camera.copy(this.parseCamera)
    }

    saveCamera(){
        const loader = new THREE.ObjectLoader()
        const cameraPDef = this.camera.toJSON()
        this.parseCamera = loader.parse(cameraPDef)
    }

    render(){
        this.stats.begin()

        this.eng.update()

        this.box1.rotation.x += 0.01
        this.box1.rotation.y += 0.01

        this.renderer.render(this.scene,this.camera)

        if (this.viewMode) this.controls.update()
        // if (!this.viewMode) this.drawingEngine.renderCursor()

        this.stats.end()

		this.processId = requestAnimationFrame( () => {
			this.render()
		} )
        // console.log('test')
    }

    addGui(){

            this.gui.add( this.params, 'Visible canvases')
            .onChange( ( visu ) => this.eng.setVisibleCanvases( visu ))

            // this.gui.add( this.params, 'Visible active canva')
            // .onChange( ( visu ) => this.eng.setVisibleActiveCanva( visu ))

            this.gui.add(this.params,'Clear active canva')

            this.gui.addColor(this.params,'Scene color')
            .onChange((color) => this.scene.background.setHex( color ))
    
            this.gui.addColor(this.params,'Brush Color')
            .onChange((newColor) => this.eng.setBrushColor( new THREE.Color(newColor) ))

            this.gui.add( this.params, 'Brush shape', [
                // 'clear',
                'brush_1',
                'brush_2',
                'brush_3',
                'brush_4',
                'brush_5',
                'brush_6',
                'brush_7',
                'brush_8',
                'brush_9',
            ])
            .onChange( ( newBrushName ) => this.eng.setBrushShape( newBrushName ))

            this.gui.add( this.params, 'Grain', [
                // 'clear',
                'grain_1',
                'grain_2',
                'grain_3',
                'grain_4',
                'grain_5',
                'grain_6',
                'grain_7',
                'grain_8',
                'uv_grid'
            ])
            .onChange( ( newGrainName ) => this.eng.setGrainTexture( newGrainName ))

            this.gui.add( this.params, 'Opacity', 0, 1, 0.1 )
            .onChange( ( newOpacity ) =>  this.eng.setOpacity ( newOpacity ))    
    
            this.gui.add( this.params, 'Brush size', 10, 100, 1 )
            .onChange((newDim) => this.eng.setBrushSize( newDim ))

            this.gui.add( this.params, 'Mode', [
                'Drawing',
                'View'
            ])
            .onChange((mode)=>{

                this.viewMode  =  (mode === 'View') 
                this.eng.viewMode = (mode === 'View') 
                this.controls.enabled = (mode === 'View') 

            })

            const pr = this.gui.addFolder('Pressure sett')

            pr.add(this.params['Pressure settings'],'adjust')
            .onChange((v)=>{
                if (this.params['Pressure settings'].adjust) this.eng.setPressure( this.params['Pressure settings'].pressure )
                
            })
            pr.add( this.params['Pressure settings'], 'pressure', 0, 1, 0.01 )
            .onChange( ( pressure ) => {
                if (this.params['Pressure settings'].adjust) this.eng.setPressure( pressure )
            })    

    }

}

export default App
