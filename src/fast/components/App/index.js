

import * as THREE from 'three'

import { GUI } from 'dat.gui'
import Stats from 'three/examples/jsm/libs/stats.module'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import Engine from '../DrawingEngine'
import Store from '../App/Strore'
import { BehaviorSubject, distinct, fromEvent, map, pairwise } from 'rxjs'
import { MathUtils } from 'three'

class App {

    gui = new GUI()
    stats = new Stats()
    viewMode = false
    canvasList = []

    store = new BehaviorSubject({
        future:[],
        paste:[],
        currentState:{
            engineLayers:[],
            someInfo:{},
            activeCanva: null,
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

        // this.store
        // .pipe(
        //     pairwise()
        // )
        // .subscribe(state => {

        //     const [prev, current] = state

        //     console.log('store prev', prev)
        //     console.log('store current', current)
        // })

        // this.store
        // .pipe(
        //     map(state => state.paste),
        //     distinct()
        // )
        // .subscribe(paste => console.log('paste', paste))

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

        this.store
        .pipe(
            map(state => state.currentState.activeCanva),
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

                this.store
                .next({
                    ...this.store.value,
                    paste:[...this.store.value.paste, {...this.store.value.currentState}],
                    currentState:{
                        ...this.store.value.currentState,
                        activeCanva: e.target.name  
                    }
                })

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

            this.store
            .next({
                ...this.store.value,
                paste:[...this.store.value.paste, {...this.store.value.currentState}],
                currentState:{
                    ...this.store.value.currentState,
                    activeCanva: null  
                }
            })

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

        // console.log(this.renderer.capabilities.maxTextureSize)

        this.scene.add(this.box1)

        // const A = new THREE.Vector3(-1,1, 0.9795075974851257)
        // const B = new THREE.Vector3(1,1, 0.9795075974851257)
        // const C = new THREE.Vector3(-1,-1,0.9795075974851257)
        // const D = new THREE.Vector3(1,-1,0.9795075974851257)


        this.saveCamera()

        this.eng = new Engine({
            renderer:this.renderer,
            canvas:this.canvas,
            appRef:this,
            brushAssets:assets,
        })


        this.scene.add(this.eng)


        // this.eng.addEventListener('onDown', (event) => this.appStore.setCurrent({...event.payload}))
        // this.eng.addEventListener('onMove', (event) => this.appStore.setCurrentAttributes({...event.payload}))
        // this.eng.addEventListener('onUp', () => this.appStore.setStroke())
        // this.eng.addEventListener('setActiveCanva', (event)=> this.appStore.setActiveCanva(event.payload))

        // this.appStore.addEventListener('onUpdateStore', (event)=> console.log(event.store))
        // this.appStore.addEventListener('onUpdateActiveCanva', (event)=> console.log(event.name))
        // this.appStore.addEventListener('onSaveStroke',(event) => console.log(event.strokes))

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
    


            // this.gui.add( this.params, 'Attach to camera', 10, 100, 1 )
            // .onChange((s) => {

            //     this.eng.setAttachToCameraActiveCanva(s)

            //     // if (!s) { 
            //     //     this.gui.remove(this.gui.__controllers[this.gui.__controllers.findIndex( child => child.property === "translate")])
            //     // }
            //     // else {
            //     //     this.gui.add( this.params, 'translate', 0, 1, 0.1 )
            //     //     .onChange((z) => this.eng.setTranslateActiveCanva(z))
            //     // }
            // })

            
            // this.gui.add( this.params, 'translate', 0, 1, 0.1 )
            // .onChange((z) => this.eng.setTranslateActiveCanva(z))
    
            // this.gui.add( this.drawingEngine.paramsCircle, 'Rotation', -180, 180, 1 )
            // .onChange((deg) => {
            //     this.drawingEngine.brushMesh.rotation.z = deg * DEG2RAD
            // })
    
            // const rlstPlaneSett = {
            //     skew:{
            //         'X': 0,
            //         prev: 0,
            //         // matrixDef:this.resultPlane.matrix.clone()
            //     },
            //     t:{
            //         'Z':0,
            //         fw:0,
            //         fh:0
            //     }
            // }

            // const rsltPlZ = 0//this.resultPlane.position.z 
    
            // this.gui.add( this.params, 'Mode', [
            //     'Drawing',
            //     'View'
            // ])
            // .onChange( ( mode ) => {
            //     this.viewMode = (mode === 'View') 
            //     this.eng.viewMode = (mode === 'View') 

            //     if (!this.viewMode){
            //         // resultPlane.position.set(0,0,0)
            //         // tempResulpPlane.position.set(0,0,0)
    
            //         // this.setCameraToDef()

            //         if (this.gui.__folders['Plane settings']){
            //             this.gui.removeFolder(this.gui.__folders['Plane settings'])
            //         }
            //         // tempResulpPlane.matrix.copy(rlstPlaneSett.skew.matrixDef.clone())
            //         // resultPlane.matrix.copy(rlstPlaneSett.skew.matrixDef.clone())
    
            //     } else {
            //         // cameraP.position.z = 1.01
            //         if (this.params['Attach to camera']){

                        
            //             const mainFolder = this.gui.addFolder('Plane settings')
            //             // const skewFolder = mainFolder.addFolder('Skew')
            //             const translatFolder = mainFolder.addFolder('Translate')
            //             // const rotFolder = mainFolder.addFolder('Rotation')
            //             // const scaleFolder = mainFolder.addFolder('Scale')
        
        
            //             // skewFolder.add(rlstPlaneSett.skew,'X',-10,10,0.01)
            //             // .onChange((x) => {
        
            //             //     // const neg = -1 
            //             //     // const pos = 1
        
            //             //     // let dir = 1
        
            //             //     // if (x===rlstPlaneSett.skew.prev) return
        
            //             //     // if (x>0){
            //             //     //     if (x>rlstPlaneSett.skew.prev){
            //             //     //         dir = pos 
            //             //     //     } else {
            //             //     //         dir = neg
            //             //     //     }
        
        
            //             //     // } else if (x<0){
            //             //     //     if (x<rlstPlaneSett.skew.prev){
            //             //     //         dir = pos 
            //             //     //     } else {
            //             //     //         dir = neg
            //             //     //     }
        
            //             //     // }
        
            //             //     // console.log(dir)
        
            //             //     // const newX = x * dir 
        
            //             //     // const matrix = new THREE.Matrix4();
        
            //             //     // matrix.makeShear(0, newX*DEG2RAD,0, 0, 0, 0);
            //             //     // // console.log(resultPlane.matrixAutoUpdate )
            //             //     // // apply shear matrix to geometry                  
            //             //     // resultPlane.matrix.multiply(matrix.clone())
            //             //     // tempResulpPlane.matrix.multiply(matrix.clone())
            //             //     // resultPlane.matrixAutoUpdate=false
            //             //     // tempResulpPlane.matrixAutoUpdate=false
        
            //             //     // rlstPlaneSett.skew.prev = x
            //             // })
        
            //             translatFolder.add(rlstPlaneSett.t,'Z',0,1,0.01)
            //             .onChange((z) => {
        
        
        
            //                 const h = 2 * Math.tan((this.camera.fov) * (Math.PI/360)) * (this.camera.near + z) 
            //                 const w = h * this.camera.aspect
            //                 const buff = [...this.resultPlane.geometry.getAttribute('position').array]
            //                 const fw = Math.abs(buff[0]) + Math.abs(buff[3]) 
            //                 // const fh = Math.abs(buff[1]) + Math.abs(buff[7]) 
            //                 // resultPlane.translateZ(-z)
            //                 // resultPlane.scale.set(w/fw,h/fh,h/fh) //.scale.set(w/fw,h/fh,1)
            //                 // tempResulpPlane.scale.set(w/fw,h/fh,h/fh)
            //                 // const m = cameraP.projectionMatrix.clone().makeTranslation(0,0,z)
            //                 // const vert = new Float32Array( buff.map((item,index) => { 
            //                 //     if (index === 2 || index === 5 || index === 8 || index === 11) return item 
            //                 //     return item * Math.abs(w/fw)
            //                 // } ) )
            //                 // resultPlane.geometry.setAttribute('position', new THREE.BufferAttribute( vert, 3 ))
            //                 // tempResulpPlane.geometry.setAttribute('position', new THREE.BufferAttribute( vert, 3 ))
        
            //                 this.resultPlane.scale.set( Math.abs(w/fw), Math.abs(w/fw),1) //.scale.set(w/fw,h/fh,1)
            //                 this.tempResulpPlane.scale.set( Math.abs(w/fw), Math.abs(w/fw),1)
        
                    
        
            //                 this.resultPlane.geometry.attributes.position.needsUpdate = true
            //                 this.tempResulpPlane.geometry.attributes.position.needsUpdate = true
        
                            
            //                 this.resultPlane.position.z = rsltPlZ - z
            //                 this.tempResulpPlane.position.z = rsltPlZ - z
        
            //             })
            //         }

                    
            //     }


            //     this.controls.enabled = this.viewMode
            // })

            // this.gui.add(this.params,'Canvas View')

            // this.gui.add(this.params,'Attach to camera')
            // .onChange((v)=>{
            //     this.params['Attach to camera'] = v

            //     if (this.params['Attach to camera']){
            //         // console.log('attach')

            //         // this.resultPlane.lookAt(this.camera.position.clone())
            //         // this.tempResulpPlane.lookAt(this.camera.position.clone())

            //         this.setCameraToDef()

            //         this.camera.attach(this.resultPlane)
            //         this.camera.attach(this.tempResulpPlane)

            //         // this.camera.lookAt(this.resultPlane.position.clone()) // when skew 

            //         if (!this.gui.__folders['Plane settings']&&this.viewMode){
            //             const mainFolder = this.gui.addFolder('Plane settings')
            //             // const skewFolder = mainFolder.addFolder('Skew')
            //             const translatFolder = mainFolder.addFolder('Translate')
            //             // const rotFolder = mainFolder.addFolder('Rotation')
            //             // const scaleFolder = mainFolder.addFolder('Scale')
        
        
            //             // skewFolder.add(rlstPlaneSett.skew,'X',-10,10,0.01)
            //             // .onChange((x) => {
        
            //             //     // const neg = -1 
            //             //     // const pos = 1
        
            //             //     // let dir = 1
        
            //             //     // if (x===rlstPlaneSett.skew.prev) return
        
            //             //     // if (x>0){
            //             //     //     if (x>rlstPlaneSett.skew.prev){
            //             //     //         dir = pos 
            //             //     //     } else {
            //             //     //         dir = neg
            //             //     //     }
        
        
            //             //     // } else if (x<0){
            //             //     //     if (x<rlstPlaneSett.skew.prev){
            //             //     //         dir = pos 
            //             //     //     } else {
            //             //     //         dir = neg
            //             //     //     }
        
            //             //     // }
        
            //             //     // console.log(dir)
        
            //             //     // const newX = x * dir 
        
            //             //     // const matrix = new THREE.Matrix4();
         
            //             //     // matrix.makeShear(0, newX*DEG2RAD,0, 0, 0, 0);
            //             //     // // console.log(resultPlane.matrixAutoUpdate )
            //             //     // // apply shear matrix to geometry                  
            //             //     // resultPlane.matrix.multiply(matrix.clone())
            //             //     // tempResulpPlane.matrix.multiply(matrix.clone())
            //             //     // resultPlane.matrixAutoUpdate=false
            //             //     // tempResulpPlane.matrixAutoUpdate=false
        
            //             //     // rlstPlaneSett.skew.prev = x
            //             // })
        
            //             translatFolder.add(rlstPlaneSett.t,'Z',0,1,0.01)
            //             .onChange((z) => {
        
        
        
            //                 const h = 2 * Math.tan((this.camera.fov) * (Math.PI/360)) * (this.camera.near + z) 
            //                 const w = h * this.camera.aspect
            //                 const buff = [...this.resultPlane.geometry.getAttribute('position').array]
            //                 const fw = Math.abs(buff[0]) + Math.abs(buff[3]) 
            //                 // const fh = Math.abs(buff[1]) + Math.abs(buff[7]) 
            //                 // resultPlane.translateZ(-z)
            //                 // resultPlane.scale.set(w/fw,h/fh,h/fh) //.scale.set(w/fw,h/fh,1)
            //                 // tempResulpPlane.scale.set(w/fw,h/fh,h/fh)
            //                 // const m = cameraP.projectionMatrix.clone().makeTranslation(0,0,z)
            //                 // const vert = new Float32Array( buff.map((item,index) => { 
            //                 //     if (index === 2 || index === 5 || index === 8 || index === 11) return item 
            //                 //     return item * Math.abs(w/fw)
            //                 // } ) )
            //                 // resultPlane.geometry.setAttribute('position', new THREE.BufferAttribute( vert, 3 ))
            //                 // tempResulpPlane.geometry.setAttribute('position', new THREE.BufferAttribute( vert, 3 ))
        
            //                 this.resultPlane.scale.set( Math.abs(w/fw), Math.abs(w/fw),1) //.scale.set(w/fw,h/fh,1)
            //                 this.tempResulpPlane.scale.set( Math.abs(w/fw), Math.abs(w/fw),1)
        
                    
        
            //                 this.resultPlane.geometry.attributes.position.needsUpdate = true
            //                 this.tempResulpPlane.geometry.attributes.position.needsUpdate = true
        
                            
            //                 this.resultPlane.position.z = rsltPlZ - z
            //                 this.tempResulpPlane.position.z = rsltPlZ - z
        
            //             })
            //         }

            //     } else {
            //         // console.log('remove')

            //         this.scene.attach(this.resultPlane)
            //         this.scene.attach(this.tempResulpPlane)

            //         this.saveCamera()

            //         if (this.gui.__folders['Plane settings']){
            //             this.gui.removeFolder(this.gui.__folders['Plane settings'])
            //         }

            //     }

            // })
    
    }

}

export default App
