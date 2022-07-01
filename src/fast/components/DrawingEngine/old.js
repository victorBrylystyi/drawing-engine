
import * as THREE from 'three'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass'
import { lerp } from 'three/src/math/MathUtils'


class DrawingEngine {

    constructor (brushes,core){
        this.brushes = brushes
        this.core = core
        this.pointerCount = 0
        this.count = 512
        this.raycaster = new THREE.Raycaster()
        this.pointer = new THREE.Vector2()
        this.currentMousePosition =  new THREE.Vector2()
        this.prevMousePosition =  new THREE.Vector2()
        this.paramsCircle = {
            'Brush size': 1,
            'Rotation': 0
        }
        this.init()
    }

    init(){

        this.rt = new THREE.WebGLRenderTarget(this.core.w,this.core.h,{
            minFilter: THREE.NearestFilter, 
            magFilter: THREE.NearestFilter,
            generateMipmaps: false, 
        })
        this.temporaryLayer = new THREE.WebGLRenderTarget(this.core.w,this.core.h,{
            minFilter: THREE.NearestFilter, 
            magFilter: THREE.NearestFilter,
            generateMipmaps: false, 
        })
        this.quad = new FullScreenQuad(new THREE.MeshBasicMaterial({
            map: this.temporaryLayer.texture, 
            transparent:true,

            // blending:THREE.CustomBlending,

            // blendSrc:THREE.SrcAlphaFactor,        // one of true variant
            // blendDst:THREE.OneMinusSrcAlphaFactor,
            // blendSrcAlpha:THREE.OneFactor,
            // blendDstAlpha:THREE.OneMinusSrcAlphaFactor,


            side:THREE.FrontSide,
        }))


        this.drawScene = new THREE.Scene()
        this.sceneCursor = new THREE.Scene()

        this.drawCamera  = new THREE.OrthographicCamera()
        this.drawCamera.left   = 0 
        this.drawCamera.right  = this.core.w 
        this.drawCamera.top    = this.core.h 
        this.drawCamera.bottom = 0
        this.drawCamera.near   = -2000
        this.drawCamera.far    = 2000
        this.drawCamera.position.z = 0.01
        this.drawCamera.updateProjectionMatrix()  //!!!! 

        const texture = this.brushes[this.brushes.findIndex( texture => texture.name === 'grain_1')] 
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        // gridTexture.flipY = false

        this.circle = new THREE.InstancedMesh(        // brush 
            new THREE.PlaneGeometry(this.core.startDim,this.core.startDim),
            // new THREE.MeshBasicMaterial({
            //     blending:THREE.CustomBlending,
            //     blendSrc:THREE.OneFactor,        
            //     blendDst:THREE.OneMinusSrcAlphaFactor,
            //     blendSrcAlpha:THREE.OneFactor,
            //     blendDstAlpha:THREE.OneMinusSrcAlphaFactor,
            //     transparent:true,
            //     color:'red',
            //     map:this.brushes[this.brushes.findIndex( texture => texture.name === 'grain_2')],
            //     alphaMap:this.brushes[this.brushes.findIndex( texture => texture.name === 'brush_2')],
            // }),
            new THREE.ShaderMaterial({
                transparent: true,
                depthTest:false, 
                depthWrite:false,
                side:THREE.FrontSide,
                // premultipliedAlpha:true,

                blendEquation: THREE.MaxEquation,

                blending:THREE.CustomBlending,

                // blendSrc:THREE.SrcColorFactor,          // def
                // blendDst:THREE.OneMinusSrcAlphaFactor,
                // blendSrcAlpha:THREE.SrcColorFactor,
                // blendDstAlpha:THREE.OneFactor,

                // blendSrc:THREE.OneFactor,         // v1
                // blendDst:THREE.ZeroFactor,
                // blendSrcAlpha:THREE.OneFactor,
                // blendDstAlpha:THREE.OneMinusSrcAlphaFactor,

                // blendSrc:THREE.OneFactor,        
                // blendDst:THREE.OneMinusSrcAlphaFactor,
                // blendSrcAlpha:THREE.OneFactor,
                // blendDstAlpha:THREE.OneMinusSrcAlphaFactor,

                // blendSrc:THREE.SrcAlphaFactor,        
                // blendDst:THREE.OneFactor,
                // blendSrcAlpha:THREE.OneFactor,
                // blendDstAlpha:THREE.OneMinusSrcAlphaFactor,

                uniforms:{
                    color: { value: new THREE.Vector4(1.0, 1.0, 1.0, 1.0)},
                    brushMap: { value: this.brushes[this.brushes.findIndex( texture => texture.name === 'brush_1')] },
                    grainMap: { value: texture},
                    canvasSize: { value: new THREE.Vector2(this.core.w, this.core.h) },
                    initialPoint: { value: new THREE.Vector2() },
                    brushSize: { value: this.core.startDim },
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
        this.circle.instanceMatrix.setUsage( THREE.DynamicDrawUsage ) // will be updated every frame
        this.drawScene.add(this.circle)

        this.brush = new THREE.Group()
        this.brushMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(this.core.startDim,this.core.startDim), 
            new THREE.MeshBasicMaterial({
                transparent: true
            })
        )
        // this.brush.add(this.brushMesh)
        this.sceneCursor.add(this.brush)
    }
    setCleanScreen(){
        this.core.renderer.setRenderTarget(this.rt)
        this.core.renderer.setClearColor(new THREE.Color(0x000000), 0)
        this.core.renderer.clearColor()
        this.core.renderer.setRenderTarget(null)
        this.renderUp()
    }

    setClearTempLayer(){
        this.core.renderer.setRenderTarget(this.temporaryLayer)
        this.core.renderer.setClearColor(new THREE.Color(0x000000), 0)
        this.core.renderer.clearColor()
        this.core.renderer.setRenderTarget(null)
    }
    down(event) {

        if (!this.core.viewMode){
            this.core.paint = true

            this.circle.material.uniforms.initialPoint.value = new THREE.Vector2(Math.random(),Math.random())
            this.circle.material.uniforms.mouseOffset.value = new THREE.Vector2(Math.random(),Math.random())
            // this.circle.material.uniformsNeedUpdate = true

            this.setClearTempLayer()

            this.pointer.x = ( event.clientX / this.core.rootElement.clientWidth) * 2 - 1
            this.pointer.y = 1 - ( event.clientY / this.core.rootElement.clientHeight ) * 2

            this.raycaster.setFromCamera(this.pointer,this.core.camera)
            const intersectObjects = this.raycaster.intersectObjects( this.core.scene.children )

            const tempLayerObject = intersectObjects.find(item => item.object.name === 'tempLayer')

            if (tempLayerObject){
                const pointerWorldPos = new THREE.Vector3(
                    tempLayerObject.uv.x * this.core.rootElement.clientWidth,
                    tempLayerObject.uv.y * this.core.rootElement.clientHeight,
                    tempLayerObject.point.z
                )
                // console.log('down')

                // console.log(event,event.tiltX,event.tiltY)
                if (!this.core.sett.adjust) this.circle.material.uniforms.pressure.value = event.pressure


                this.currentMousePosition.set(pointerWorldPos.x,pointerWorldPos.y)
    
                this.circle.count = 1
                const matrix = new THREE.Matrix4()
                // matrix.makeRotationZ(this.paramsCircle['Rotation']*DEG2RAD)
                matrix.setPosition(pointerWorldPos)
                this.circle.setMatrixAt(0, matrix)
                this.circle.instanceMatrix.needsUpdate = true
    
                this.renderMove()
                // this.renderUp()
            } 
        }
    }

    move (event) {
        if (!this.core.viewMode){
            // const wp = drag(event, rootElement)
            // const wp = drag(event, {clientHeight:this.core.h,clientWidth:this.core.w})
            
            // this.brush.position.set(wp.x,wp.y,0)

            if (this.core.paint){

                this.prevMousePosition.copy(this.currentMousePosition)
                // const pointerWorldPos = drag(event, rootElement)
                // const pointerWorldPos = drag(event, {clientHeight:h,clientWidth:w})
                this.pointer.x = ( event.clientX / this.core.rootElement.clientWidth) * 2 - 1
                this.pointer.y = 1 - ( event.clientY / this.core.rootElement.clientHeight ) * 2

                this.raycaster.setFromCamera(this.pointer,this.core.camera)
                const intersectObjects = this.raycaster.intersectObjects( this.core.scene.children )
                // console.log('intersectObjects', intersectObjects)
                const tempLayerObject = intersectObjects.find(item => item.object.name === 'tempLayer')
                // const pointerWorldPos = drag(event, {clientHeight:h,clientWidth:w})
                if (tempLayerObject){

                    this.core.shouldDraw = true
                    // const pr = Math.floor( event.pressure * 10) /10
                    // console.log('move')
                    if (!this.core.sett.adjust) this.circle.material.uniforms.pressure.value = event.pressure 

                    const pointerWorldPos = new THREE.Vector3(
                        tempLayerObject.uv.x * this.core.rootElement.clientWidth,
                        tempLayerObject.uv.y * this.core.rootElement.clientHeight,
                        tempLayerObject.point.z
                    )
                    this.currentMousePosition.set(pointerWorldPos.x,pointerWorldPos.y)

                    const distance = Math.floor(this.prevMousePosition.distanceTo(this.currentMousePosition))

                    // const mouseOffset = new THREE.Vector2()
                    // mouseOffset.set(this.currentMousePosition.x - this.prevMousePosition.x,this.currentMousePosition.y - this.prevMousePosition.y)
                    // const pos = mouseOffset.clone().normalize().addScalar(1).divideScalar(2)
                    // console.log(pos)
                    // this.circle.material.uniforms.mouseOffset.value = pos
                    // this.circle.material.uniformsNeedUpdate = true

                    // console.log(distance,this.prevMousePosition.distanceTo(this.currentMousePosition))

                    if (distance > 1){
                        this.circle.count = distance + this.pointerCount

                        for (let i = 0; i < distance; i++){

                            const dt = i / distance
                            const x = lerp(this.prevMousePosition.x, this.currentMousePosition.x, dt)
                            const y = lerp(this.prevMousePosition.y, this.currentMousePosition.y, dt)
                            const matrix = new THREE.Matrix4()
                            // matrix.makeRotationZ(this.paramsCircle['Rotation']*DEG2RAD)
                            matrix.setPosition(x,y,0)
                            this.circle.setMatrixAt(i + this.pointerCount, matrix)
                            this.circle.instanceMatrix.needsUpdate = true
                        }
                        this.pointerCount += distance
                    } else {
                        // this.circle.count = 0
                        this.circle.count += 1
                        const matrix = new THREE.Matrix4()
                        // matrix.makeRotationZ(this.paramsCircle['Rotation']*DEG2RAD)
                        matrix.setPosition(pointerWorldPos)
                        this.circle.setMatrixAt(this.circle.count-1, matrix)
                        this.circle.instanceMatrix.needsUpdate = true
                    }
                    // this.pointerCount += (distance-1)
                } else {

                    this.core.shouldDraw = false
                    // pointerCount = 0 
                }

            }
        }
    }

    up(){
        // event.preventDefault()
        this.core.paint = false
        this.core.shouldDraw = false

        
        if (!this.core.viewMode) {
            console.log('up')
            this.renderUp()
            this.setClearTempLayer()
        } 
       
    }

    renderUp(){
        this.core.renderer.autoClear = false
        
        this.core.renderer.setRenderTarget(this.rt)
        this.core.renderer.clearDepth()

        this.quad.render(this.core.renderer)


        this.core.renderer.autoClear = true
    
        this.core.renderer.setRenderTarget(null)
        // this.pointerCount = 0
        // quad.render(renderer)

        // this.core.tempResulpPlane.visible = false
        // this.core.resultPlane.visible = true
        // resultPlane.visible = true
    }
    renderMove(){
        this.core.renderer.autoClear = false
        
        this.core.renderer.setRenderTarget(this.temporaryLayer)
        this.core.renderer.clearDepth()
        this.core.renderer.render(this.drawScene,this.drawCamera)
    
        this.core.renderer.setRenderTarget(null)
        // this.quad.render(this.core.renderer) // что бы видеть прошлое что нарисовали 
        // quad2.render(renderer)

        this.core.renderer.autoClear = true

        // this.core.tempResulpPlane.visible = true
        // this.core.resultPlane.visible = false

        this.pointerCount = 0 // clear integrate instancedMeshs index
    }
    renderCursor(){
        this.core.renderer.autoClear = false
        this.core.renderer.setRenderTarget(null)
        this.core.renderer.clearDepth()
        this.core.renderer.render(this.sceneCursor,this.drawCamera)
    }
}

export default DrawingEngine 
