
import * as THREE from 'three'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass'
import Canva from '../Canva'
import { lerp } from 'three/src/math/MathUtils'
import WorkLayer from '../WorkLayer'
// import DrawingStore from '../Store'
import { animationFrameScheduler, BehaviorSubject, distinct, fromEvent, map, observeOn, pairwise } from 'rxjs'
import { MathUtils } from 'three'

const init = {
    id: null,
    attributes:{
        position:[],
        pressure: [],
        tilt:[],
    }, 
    brush: null,
    grain: null,
    size: 0,
    brushColor: {
        r:0,
        g:0,
        b:0,
        a:1,
    }, 
    opacity: 1,
}

class Engine extends THREE.Object3D {

    isDrawingEngine = true
    count = 512
    drawScene = new THREE.Scene()
    drawCamera  = new THREE.OrthographicCamera()
    raycaster = new THREE.Raycaster()
    pointer = new THREE.Vector2()
    currentMousePosition =  new THREE.Vector2()
    prevMousePosition =  new THREE.Vector2()
    shouldDraw = false
    paint = false
    pointerCount = 0
    defBrushSize = 50
    viewMode = false
    canvaList = []
    activeCanva = null
    // store = new DrawingStore('engineStore')

    engineStore = new BehaviorSubject({
        activeLayer: null,
        layers: []
    })

    currentStroke = new BehaviorSubject(JSON.parse(JSON.stringify({...init})))

    constructor({renderer, canvas, brushAssets, appRef}){
        super()
        this.raycaster.near = -1
        this.renderer = renderer
        this.canvas = canvas
        this.brushAssets = brushAssets
        this.core = appRef

        this.workLayer = new WorkLayer(this)

        this.quad = new FullScreenQuad(new THREE.MeshBasicMaterial({
            map: this.workLayer.temporaryLayerRT.texture, 
            transparent:true,
            side:THREE.FrontSide,
        }))

        this.quad2 = new FullScreenQuad(new THREE.MeshBasicMaterial({
            side: THREE.FrontSide,
            blending:THREE.CustomBlending,
            blendSrc:THREE.OneFactor,        
            blendDst:THREE.OneMinusSrcAlphaFactor,
            blendSrcAlpha:THREE.OneFactor,
            blendDstAlpha:THREE.OneMinusSrcAlphaFactor,
            transparent:true,
        }))


        this.drawCamera.left   = 0 
        this.drawCamera.right  = this.canvas.clientWidth
        this.drawCamera.top    = this.canvas.clientHeight
        this.drawCamera.bottom = 0
        this.drawCamera.near   = -2000
        this.drawCamera.far    = 2000
        this.drawCamera.position.z = 0.01
        this.drawCamera.updateProjectionMatrix()  //!!!! 


        this.brush = new THREE.InstancedMesh (        // brush 
            new THREE.PlaneGeometry(this.defBrushSize,this.defBrushSize),
            new THREE.ShaderMaterial({
                transparent: true,
                depthTest:false, 
                depthWrite:false,
                side:THREE.FrontSide,
                blendEquation: THREE.MaxEquation,
                blending:THREE.CustomBlending,
                uniforms:{
                    color: { value: new THREE.Vector4(0.0, 0.0, 0.0, 1.0)},
                    brushMap: { value: this.brushAssets[this.brushAssets.findIndex( texture => texture.name === 'brush_1')] },
                    grainMap: { value: this.brushAssets[this.brushAssets.findIndex( texture => texture.name === 'grain_1')] },
                    canvasSize: { value: new THREE.Vector2(this.canvas.clientWidth,this.canvas.clientHeight) },
                    initialPoint: { value: new THREE.Vector2() },
                    brushSize: { value: this.defBrushSize },
                    mouseOffset: { value: new THREE.Vector2() },
                    pressureBleed:{value: 1.0},
                    pressure:{value: 0.5},

                    pressureOpacity:{value:1.0},
                    nodeOpacityScale:{value:1.0},
                    tilt:{value:0.0},
                    tiltOpacity:{value:1.0}

                },
                vertexShader:`

                    varying vec2 vUv;
                    varying vec2 uvOffset;

                    uniform vec2 canvasSize;


                    void main() {
                
                        vec4 mvPosition = instanceMatrix * vec4( position, 1.0 );
                
                        vec4 modelViewPosition = modelViewMatrix * mvPosition;
                        gl_Position = projectionMatrix * modelViewPosition;
                        vUv = uv;
                        uvOffset = vec2(mvPosition.x / canvasSize.x, mvPosition.y / canvasSize.y);
                    }
                `,

                fragmentShader:`
                        varying vec2 vUv;
                        varying vec2 uvOffset;

                        uniform sampler2D brushMap;
                        uniform sampler2D grainMap;
                        uniform vec4 color;

                        uniform vec2 canvasSize;
                        uniform float brushSize;
                        uniform vec2 initialPoint;
                        uniform vec2 mouseOffset;

                        uniform float pressure;
                        uniform float pressureBleed;

                        uniform float pressureOpacity;
                        uniform float nodeOpacityScale;
                        uniform float tilt;
                        uniform float tiltOpacity;


                        void main( void ) {

                            // float uBleed = pow(1.0 - pressure, 1.6) * pressureBleed;

                            vec2 brushUV = initialPoint + uvOffset; //+ vUv * vec2(brushSize / canvasSize.x, brushSize / canvasSize.y);

                            vec4 brushMapColor = texture2D(brushMap, vUv);
                            vec4 resultColor = texture2D(grainMap, brushUV);

                            // float uBleed = pow(1.0 - pressure, 1.6) * pressureBleed;
                            // float uBleed = mix( resultColor.r, vec3(1.0), max(0.0, (pressure - 0.5) * 2.0) );

                            // float uOpacity = 1.0 - (1.0 - pressure) * pressureOpacity;
                            // float tiltOp = 1.0 - tilt / 90.0 * tiltOpacity;
                            // uOpacity *= tiltOp * nodeOpacityScale;
                            vec3 colorBleed = mix( resultColor.rgb, vec3(1.0), max(0.0, (pressure - 0.5) * 2.0) );

                            gl_FragColor = vec4(color.rgb , brushMapColor.r * colorBleed.r );
                            gl_FragColor.a *= clamp(pressure * 2.0, 0.0, 1.0);  //uOpacity * (((1.0+uBleed)) - uBleed ) * (1.0+ uBleed);

                            // gl_FragColor = vec4(color.rgb, 1.0);

                            // gl_FragColor *= ((brushMapColor.r * resultColor.r * (1.0+uBleed)) - uBleed ) * (1.0+ uBleed) * uOpacity ;

                        }
                `
            }),
            this.count
        )
        this.brush.instanceMatrix.setUsage( THREE.DynamicDrawUsage ) // will be updated every frame


        this.drawScene.add(this.brush)


        fromEvent(this.canvas, 'pointerdown')
        .subscribe((event) => this._down(event))

        fromEvent(this.canvas, 'pointermove')
        .subscribe((event) => this._move(event))

        fromEvent(this.canvas, 'pointerup')
        .subscribe(() => this._upHandler())

        // this.engineStore
        // .subscribe(state => console.log('engLayers', state))

        this.engineStore
        .pipe(
            map( state => state.layers ),
            distinct(),
        )
        .subscribe(layers => {
            console.log('engine', layers)
            for (let i=0; i < layers.length; i++){
                if(! this.canvaList.find(canva => canva.userData.id === layers[i].id)){
                    const canva = this.createNewCanva(layers[i].name)
                    canva.userData = {
                        ...canva.userData,
                        id: layers[i].id
                    }
                    this.canvaList.push(canva)
                    
                    if(layers[i].position) canva.position.set(layers[i].position[0], layers[i].position[1],layers[i].position[2])

                }
            }
        })

        this.engineStore
        .pipe(
            map( state => state.activeLayer ),
            pairwise(),
        )
        .subscribe(state => {

            const [paste, current] = state

            if(current !== paste){
                this.setActiveCanvaById(current)
            }
        })

        this.currentStroke
        .pipe(
            distinct()
        )
        .subscribe(state => console.log(state))


        // this.engineStore
        // .pipe(
        //     map(state => state.layers)
        // )
        // .subscribe(layers => console.log('engine layers', layers))

        // this.currentStroke
        // .pipe(
        //     observeOn(animationFrameScheduler)
        // )
        // .subscribe(currentStroke => console.log('change current stroke', currentStroke))

        // this.store
        // .pipe(
        //     map(store => store.strokes),
        //     pairwise(),
        //     observeOn(animationFrameScheduler)
        // )
        // .subscribe(state => {

        //     console.log('store', state)

        //     const [prevStrokes, nextStrokes] = state

        //     if(nextStrokes.length){
        //     // if((prevStrokes.length + 1) === nextStrokes.length){

        //         const lastStroke = nextStrokes[nextStrokes.length -1]

        //         if (lastStroke.id === this.currentStroke.value.id) return 

        //     }

        //     console.log('render')

        //     // render nextStrokes
        // })

        // this.canvas.addEventListener('pointerdown', (event) => this._down(event))
        // this.canvas.addEventListener('pointermove', (event) => this._move(event))
        // this.canvas.addEventListener('pointerup', () => this._upHandler())



        // this.addEventListener('onDown', (event) => this.store.setCurrent({...event.payload}))
        // this.addEventListener('onMove', (event) => this.store.setCurrentAttributes({...event.payload}))
        // this.addEventListener('onUp', () => this.store.setStroke())

        // this.store.addEventListener('onSaveStroke',(event) => console.log(event.strokes))

    }

    getCanvaById(id){

        return this.canvaList.find(canva => canva.userData.id === id)

    }

    drawByStore(){


    }

    _onDown(){


        // const currentData = this.store.getInitStore()  

        // currentData.id = THREE.MathUtils.generateUUID()

        // currentData.brush = this.brush.material.uniforms.brushMap.value.name 
        // currentData.grain = this.brush.material.uniforms.grainMap.value.name 
        // currentData.canvaName = this.activeCanva.name
        // currentData.size = this.brush.material.uniforms.brushSize.value

        // currentData.brushColor.r = this.brush.material.uniforms.color.value.x
        // currentData.brushColor.g = this.brush.material.uniforms.color.value.y
        // currentData.brushColor.b = this.brush.material.uniforms.color.value.z
        // currentData.brushColor.a = this.brush.material.uniforms.color.value.w

        // currentData.opacity =  this.workLayer.tempLayer.material.opacity

        // return currentData

        // this.currentStroke      // mouseDown
        // .next({
        //     ...this.currentStroke.value,
        //     id: MathUtils.generateUUID()
        // })
    }

    _onMove(position = [], pressure = 0.5, tilt = 0){

        // this.currentStroke      // mouseMove 
        // .next({
        //     ...this.currentStroke.value,
        //     positions: [...this.currentStroke.value.positions, [...position]],
        //     pressure: [...this.currentStroke.value.pressure, pressure],
        //     tilt: [...this.currentStroke.value.pressure, tilt],
        //     startPoint: this.currentStroke.value.positions.length
        // })


        return {position, pressure, tilt}
    }

    _onUp(){

        // const newStroke = {
        //     id: this.currentStroke.value.id,
        //     positions: this.currentStroke.value.positions,
        //     pressure: this.currentStroke.value.pressure,
        //     tilt: this.currentStroke.value.tilt
        // }

        // this.store // mouseUp
        // .next({
        //     strokes: [...this.store.value.strokes, newStroke ]
        // })

        return 'onUpSettings'
    }

    setCleanScreenActiveLayer(){

        if (this.activeCanva){

            this.renderer.setRenderTarget(this.workLayer.mainLayerRT)
            // const color = new THREE.Color()
            // color.r = Math.random()
            // color.g = Math.random()
            // color.b = Math.random()
            this.renderer.setClearColor(new THREE.Color(0x000000), 0)
            // this.renderer.setClearColor(color, 1)
            this.renderer.clearColor()
            this.renderer.setRenderTarget(null)
            this._renderUp()
        }

    }

    setClearTempLayer(){
        this.renderer.setRenderTarget(this.workLayer.temporaryLayerRT)
        this.renderer.setClearColor(new THREE.Color(0x000000), 0)
        this.renderer.clearColor()
        this.renderer.setRenderTarget(null)
    }
    
    setBrushColor( color ){
        this.brush.material.uniforms.color.value.set(color.r,color.g,color.b, 1.0)
    }

    setBrushShape( name = 'brush_1' ){
        const texture = this.brushAssets[this.brushAssets.findIndex( texture => texture.name === name)]
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        this.brush.material.uniforms.brushMap.value = texture
    }

    setGrainTexture( name = 'grain_1' ){
        const texture = this.brushAssets[this.brushAssets.findIndex( texture => texture.name === name)]
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        this.brush.material.uniforms.grainMap.value = texture
    }

    setPressure( pressure ){
        this.brush.material.uniforms.pressure.value = pressure
    }

    setOpacity( opacity ){

        this.quad.material.opacity = opacity
        this.workLayer.tempLayer.material.opacity = opacity
    }

    setBrushSize( size ){

        const scale = size/this.defBrushSize 

        this.brush.geometry.scale(scale,scale,scale)
        this.defBrushSize = size

        this.brush.material.uniforms.brushSize.value = size
    }

    updateCanvases(camera){
        for (const child of this.children){
            if (child.isCanva && child.isAttachToCamera){ 
                child.updateFromCamera(camera)
            }
        }
    }

    addToCanvaList (newCanva){

        this.add(newCanva)
        this.canvaList.push(newCanva)
        // this.eng.add(newCanva)

    }

    setVisibleCanvases(visu){
        for (const canva of this.canvaList){
            canva.visible = visu
        }
        this.visible = visu
    }

    _foundCanvaByName(name){

        return name !== 'none' ? this.children[this.children.findIndex( child => child.name === name)] || this.canvaList[this.canvaList.findIndex( child => child.name === name)] : null
    }

    _foundCanvaById(id){

        return id ? this.children.find( child => child.userData.id === id) || this.canvaList.find( child => child.userData.id === id) : null
        
    }

    setVisibleActiveCanva(visu){

        if (this.activeCanva) this.activeCanva.visible = visu

    }

    changeVisibleCanva(name){

        const canva = this._foundCanvaByName(name)

        if (canva)  canva.visible = !canva.visible
    

    }

    setParallelTranslate(layer, z){

        const h = 2 * Math.tan((this.core.camera.fov) * (Math.PI/360)) * (this.core.camera.near + z) 
        const w = h * this.core.camera.aspect

        layer.traverse((object) => {
            if(object.isMesh){
                const buff = [...object.geometry.getAttribute('position').array]
                const fw = Math.abs(buff[0]) + Math.abs(buff[3]) 
                object.scale.set( Math.abs(w/fw), Math.abs(w/fw),1)
                object.geometry.attributes.position.needsUpdate = true
                object.position.z = 0 - z
            }
        })

    }

    setTranslateActiveCanva(z){

        if(this.activeCanva && this.activeCanva.isAttachToCamera){

            this.activeCanva.translateZValue = z 

            this.setParallelTranslate(this.activeCanva, z)

            // const h = 2 * Math.tan((this.core.camera.fov) * (Math.PI/360)) * (this.core.camera.near + z) 
            // const w = h * this.core.camera.aspect

    
            // // const buff = [...this.activeCanva.mainLayer.geometry.getAttribute('position').array]
            // // const fw = Math.abs(buff[0]) + Math.abs(buff[3]) 

            // this.activeCanva.traverse((object) => {
            //     if(object.isMesh){
                        // const buff = [...object.geometry.getAttribute('position').array]
                        // const fw = Math.abs(buff[0]) + Math.abs(buff[3]) 
            //         object.scale.set( Math.abs(w/fw), Math.abs(w/fw),1)
            //         object.geometry.attributes.position.needsUpdate = true
            //         object.position.z = 0 - z
            //     }
            // })
        }

    }

    createNewCanva (name = 'Canva 0'){

        const newCanva = new Canva(this, name)
        this.addToCanvaList(newCanva)

        return newCanva
    }

    setAttachToCameraActiveCanva(v){

        if (this.activeCanva){
            if (v && !this.activeCanva.isAttachToCamera){

                this.core.setCameraToDef()
    
                this.core.camera.attach(this.activeCanva)
  
    
            } else if (!v && this.activeCanva.isAttachToCamera){
                this.attach(this.activeCanva)
                this.core.saveCamera()
            }

            this.activeCanva.isAttachToCamera = v

        }

    }

    setVisibleCanvaByName(name, visu){

       this._foundCanvaByName(name).visible = visu

    }

    setActiveCanvaById(id = null){

        if (!id) {

            this.activeCanva = null

        } 

        const canva =  this._foundCanvaById(id)



        if (canva){
            this.activeCanva = canva

            // this.activeCanva.add(this.workLayer)
            // const deltaZ = this.activeCanva.mainLayer.position.z - this.workLayer.tempLayer.position.z
            // console.log(deltaZ)

            // this.setParallelTranslate(this.workLayer, deltaZ)
            this.activeCanva.attach(this.workLayer) // templayer в прошлой позиции как и зазмер 
    
            this.renderer.setRenderTarget(this.workLayer.mainLayerRT)
            this.renderer.setClearColor(new THREE.Color(0x000000), 0)
            this.renderer.clearColor()
    
            this.quad2.material.map = this.activeCanva.mainLayer.material.map
            this.quad2.render(this.renderer)
    
            this.renderer.setRenderTarget(null)

            if (!this.activeCanva.isAddToEngine) this.activeCanva.updateFromCamera(this.core.camera) /// !!!

            // this.activeCanva.updateFromCamera(this.core.camera) /// !!!


            this.activeCanva.isAddToEngine = true

            // console.log('main',this.activeCanva.mainLayer.position.clone())
            // console.log('temp',this.workLayer.tempLayer.position.clone())


        }
        console.log(canva)

        // this.dispatchEvent({
        //     type:'setActiveCanva',
        //     payload: (name !== 'none') && (canva) ? name : null
        // })

    }

    setActiveCanva(name = ''){

        if (name === 'none') {
            // if (this.activeCanva) this.activeCanva.visible = false

            this.activeCanva = null

        } 

        const canva =  this._foundCanvaByName(name)



        if (canva){
            this.activeCanva = canva

            // this.activeCanva.add(this.workLayer)
            // const deltaZ = this.activeCanva.mainLayer.position.z - this.workLayer.tempLayer.position.z
            // console.log(deltaZ)

            // this.setParallelTranslate(this.workLayer, deltaZ)
            this.activeCanva.attach(this.workLayer) // templayer в прошлой позиции как и зазмер 
    
            this.renderer.setRenderTarget(this.workLayer.mainLayerRT)
            this.renderer.setClearColor(new THREE.Color(0x000000), 0)
            this.renderer.clearColor()
    
            this.quad2.material.map = this.activeCanva.mainLayer.material.map
            this.quad2.render(this.renderer)
    
            this.renderer.setRenderTarget(null)

            if (!this.activeCanva.isAddToEngine) this.activeCanva.updateFromCamera(this.core.camera) /// !!!

            // this.activeCanva.updateFromCamera(this.core.camera) /// !!!


            this.activeCanva.isAddToEngine = true

            // console.log('main',this.activeCanva.mainLayer.position.clone())
            // console.log('temp',this.workLayer.tempLayer.position.clone())


        }
        console.log(canva)

        // this.dispatchEvent({
        //     type:'setActiveCanva',
        //     payload: (name !== 'none') && (canva) ? name : null
        // })

    }

    _down(event) {

        if (!this.viewMode && this.activeCanva){
            this.paint = true

            this.brush.material.uniforms.initialPoint.value = new THREE.Vector2(Math.random(),Math.random())
            this.brush.material.uniforms.mouseOffset.value = new THREE.Vector2(Math.random(),Math.random())
            // this.brush.material.uniformsNeedUpdate = true

            this.setClearTempLayer()

            this.pointer.x = ( event.clientX / this.canvas.offsetWidth) * 2 - 1
            this.pointer.y = 1 - ( event.clientY / this.canvas.offsetHeight ) * 2

            this.raycaster.setFromCamera(this.pointer,this.core.camera)

            const intersectObjects = this.raycaster.intersectObjects( this.core.scene.children )

            const tempLayerObject = intersectObjects.find(item => item.object.name === 'tempLayer')


            // console.log(intersectObjects)

            if (tempLayerObject){
                const pointerWorldPos = new THREE.Vector3(
                    tempLayerObject.uv.x * this.canvas.clientWidth,
                    tempLayerObject.uv.y * this.canvas.clientHeight,
                    tempLayerObject.point.z
                )

                if (!this.core.params['Pressure settings'].adjust) this.setPressure(event.pressure) 

                this.currentMousePosition.set(pointerWorldPos.x,pointerWorldPos.y)
    
                this.brush.count = 1
                const matrix = new THREE.Matrix4()
                matrix.setPosition(pointerWorldPos)
                this.brush.setMatrixAt(0, matrix)
                this.brush.instanceMatrix.needsUpdate = true
    
                this._renderMove()

                this.currentStroke
                .next({
                    ...this.currentStroke.value,
                    id: MathUtils.generateUUID(),
                    attributes:{
                        position: [...this.currentStroke.value.attributes.position, [pointerWorldPos.x,pointerWorldPos.y,pointerWorldPos.z]],
                        pressure: [...this.currentStroke.value.attributes.pressure, this.brush.material.uniforms.pressure.value],
                        tilt:[...this.currentStroke.value.attributes.tilt, 0]
                    },
                    brush: this.brush.material.uniforms.brushMap.value.name,
                    grain: this.brush.material.uniforms.grainMap.value.name,
                    size: this.brush.material.uniforms.brushSize.value,
                    brushColor:{
                        r: this.brush.material.uniforms.color.value.x,
                        g: this.brush.material.uniforms.color.value.y,
                        b: this.brush.material.uniforms.color.value.z,
                        a: this.brush.material.uniforms.color.value.w
                    },
                    opacity: this.workLayer.tempLayer.material.opacity
                })

                // this.dispatchEvent({
                //     type:'onDown',
                //     payload: this._onDown()
                // })

                // this.dispatchEvent({
                //     type:'onMove',
                //     payload: this._onMove([pointerWorldPos.x,pointerWorldPos.y,0], this.brush.material.uniforms.pressure.value)
                // })

                // } 
            } 
        }
    }

    _move (event) {
        if (!this.viewMode && this.activeCanva){

            if (this.paint){

                this.prevMousePosition.copy(this.currentMousePosition)
                // const pointerWorldPos = drag(event, rootElement)
                // const pointerWorldPos = drag(event, {clientHeight:h,clientWidth:w})
                // this.pointer.x = ( event.clientX / this.canvas.clientWidth) * 2 - 1
                // this.pointer.y = 1 - ( event.clientY / this.canvas.clientHeight ) * 2

                this.pointer.x = ( event.clientX / this.canvas.offsetWidth) * 2 - 1
                this.pointer.y = 1 - ( event.clientY / this.canvas.offsetHeight ) * 2

                this.raycaster.setFromCamera(this.pointer,this.core.camera)
                const intersectObjects = this.raycaster.intersectObjects( this.core.scene.children )
                const tempLayerObject = intersectObjects.find(item => item.object.name === 'tempLayer')

                if (tempLayerObject){

                    this.shouldDraw = true
  
                    if (!this.core.params['Pressure settings'].adjust) this.setPressure(event.pressure) 

                    const pointerWorldPos = new THREE.Vector3(
                        tempLayerObject.uv.x * this.canvas.clientWidth,
                        tempLayerObject.uv.y * this.canvas.clientHeight,
                        tempLayerObject.point.z
                    )
                    this.currentMousePosition.set(pointerWorldPos.x,pointerWorldPos.y)

                    const distance = Math.floor(this.prevMousePosition.distanceTo(this.currentMousePosition))

                    if (distance > 1){
                        this.brush.count = distance + this.pointerCount

                        for (let i = 0; i < distance; i++){

                            const dt = i / distance
                            const x = lerp(this.prevMousePosition.x, this.currentMousePosition.x, dt)
                            const y = lerp(this.prevMousePosition.y, this.currentMousePosition.y, dt)
                            const matrix = new THREE.Matrix4()
                            matrix.setPosition(x,y,0)
                            this.brush.setMatrixAt(i + this.pointerCount, matrix)
                            this.brush.instanceMatrix.needsUpdate = true

                            this.currentStroke
                            .next({
                                ...this.currentStroke.value,
                                attributes:{
                                    position: [...this.currentStroke.value.attributes.position, [x, y, 0]],
                                    pressure: [...this.currentStroke.value.attributes.pressure, this.brush.material.uniforms.pressure.value],
                                    tilt:[...this.currentStroke.value.attributes.tilt, 0]
                                }
                            })

                            // this.dispatchEvent({
                            //     type:'onMove',
                            //     payload: this._onMove([x,y,0],this.brush.material.uniforms.pressure.value)
                            // })
                        }
                        this.pointerCount += distance
                    } else {
                        this.brush.count += 1
                        const matrix = new THREE.Matrix4()
                        matrix.setPosition(pointerWorldPos)
                        this.brush.setMatrixAt(this.brush.count-1, matrix)
                        this.brush.instanceMatrix.needsUpdate = true

                        this.currentStroke
                        .next({
                            ...this.currentStroke.value,
                            attributes:{
                                position: [...this.currentStroke.value.attributes.position, [pointerWorldPos.x, pointerWorldPos.y, pointerWorldPos.z]],
                                pressure: [...this.currentStroke.value.attributes.pressure, this.brush.material.uniforms.pressure.value],
                                tilt:[...this.currentStroke.value.attributes.tilt, 0]
                            }
                        })

                        // this.dispatchEvent({
                        //     type:'onMove',
                        //     payload: this._onMove([pointerWorldPos.x,pointerWorldPos.y,0],this.brush.material.uniforms.pressure.value)
                        // })
                    }



                } else {
                    this.shouldDraw = false
                }

            }
        }
    }

    _upHandler(){
        // event.preventDefault()
        // console.log('up')

        if(!this.viewMode && this.activeCanva && this.paint){
            this._renderUp()
            this.setClearTempLayer()

            this.activeCanva.strokes
            .next([
                ...this.activeCanva.strokes.value, {...this.currentStroke.value}
            ])

            this.currentStroke
            .next(JSON.parse(JSON.stringify({...init})))

            

            // this.dispatchEvent({
            //     type:'onUp',
            //     payload: this._onUp()
            // })
        }

        this.paint = false
        this.shouldDraw = false

    }

    _renderUp(){
        this.renderer.autoClear = false
        
        this.renderer.setRenderTarget(this.workLayer.mainLayerRT)
        this.renderer.clearDepth()

        this.quad.render(this.renderer)


        this.renderer.autoClear = true

        this.renderer.copyFramebufferToTexture(new THREE.Vector2(0,0),this.activeCanva.mainLayer.material.map)
    
        this.renderer.setRenderTarget(null)

    }

    _renderMove(){
        this.renderer.autoClear = false
        
        this.renderer.setRenderTarget(this.workLayer.temporaryLayerRT)
        this.renderer.clearDepth()
        this.renderer.render(this.drawScene,this.drawCamera) 
    
        this.renderer.setRenderTarget(null)

        this.renderer.autoClear = true

        this.pointerCount = 0 // clear integrate instancedMeshs index
    }

    update(){

        if (!this.viewMode && this.shouldDraw && this.activeCanva){
            this._renderMove()
            this.shouldDraw = false
        }

    }

}

export default Engine