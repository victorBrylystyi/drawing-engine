import * as THREE from 'three'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass'
import { drag } from '../../utils'
import { lerp, DEG2RAD } from 'three/src/math/MathUtils'


class DrawingEngine {

    constructor (brushes,core){
        this.brushes = brushes
        this.core = core
        this.pointerCount = 0
        this.count = 256
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

            // blendSrc:THREE.OneFactor,        
            // blendDst:THREE.OneMinusSrcAlphaFactor,
            // blendSrcAlpha:THREE.OneFactor,
            // blendDstAlpha:THREE.OneMinusSrcAlphaFactor,

            // blendSrc:THREE.SrcAlphaFactor,        // one of true variant
            // blendDst:THREE.OneMinusSrcAlphaFactor,
            // blendSrcAlpha:THREE.OneFactor,
            // blendDstAlpha:THREE.OneMinusSrcAlphaFactor,


            side:THREE.FrontSide,
            depthWrite:false,
            depthTest:false
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

        this.circle = new THREE.InstancedMesh(        // brush 
            new THREE.PlaneGeometry(this.core.startDim,this.core.startDim),
            new THREE.MeshBasicMaterial({
                transparent:true,
                depthTest:false, 
                depthWrite:false,
                alphaTest:0,
                map:this.brushes[this.brushes.findIndex( texture => texture.name === 'brush_1')] 
            }),
            this.count
        )
        this.circle.instanceMatrix.setUsage( THREE.DynamicDrawUsage ) // will be updated every frame
        this.drawScene.add(this.circle)

        this.brush = new THREE.Group()
        this.brushMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(this.core.startDim,this.core.startDim), 
            new THREE.MeshBasicMaterial({
                map:this.brushes[this.brushes.findIndex( texture => texture.name === 'brush_1')] ,
                transparent: true
            })
        )
        this.brush.add(this.brushMesh)
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

        if (!this.viewMode){
            this.core.paint = true



            this.pointer.x = ( event.clientX / this.core.rootElement.clientWidth) * 2 - 1
            this.pointer.y = 1 - ( event.clientY / this.core.rootElement.clientHeight ) * 2

            this.raycaster.setFromCamera(this.pointer,this.core.camera)
            const intersectObjects = this.raycaster.intersectObjects( this.core.scene.children )

            const tempLayerObject = intersectObjects.find(item => item.object.name === 'tempLayer')
            // console.log('pointer', pointer.clone(), tempLayerObject.uv.clone())
            // const pointerWorldPos = drag(event, {clientHeight:h,clientWidth:w})
            // console.log('intersectObjects', intersectObjects)
            if (tempLayerObject){
                const pointerWorldPos = new THREE.Vector3(
                    tempLayerObject.uv.x * this.core.rootElement.clientWidth,
                    tempLayerObject.uv.y * this.core.rootElement.clientHeight,
                    tempLayerObject.point.z
                )

                this.currentMousePosition.set(pointerWorldPos.x,pointerWorldPos.y)
    
                this.circle.count = 1
                const matrix = new THREE.Matrix4()
                matrix.makeRotationZ(this.paramsCircle['Rotation']*DEG2RAD)
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
            const wp = drag(event, {clientHeight:this.core.h,clientWidth:this.core.w})
            
            this.brush.position.set(wp.x,wp.y,0)

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

                    const pointerWorldPos = new THREE.Vector3(
                        tempLayerObject.uv.x * this.core.rootElement.clientWidth,
                        tempLayerObject.uv.y * this.core.rootElement.clientHeight,
                        tempLayerObject.point.z
                    )
                    this.currentMousePosition.set(pointerWorldPos.x,pointerWorldPos.y)

                    const distance = Math.floor(this.prevMousePosition.distanceTo(this.currentMousePosition))

                    this.circle.count = (distance - 1) + this.pointerCount

                    if (distance > 1){

                        for (let i = 0; i < distance; i++){

                            const dt = i / (distance-1)
                            const x = lerp(this.prevMousePosition.x, this.currentMousePosition.x, dt)
                            const y = lerp(this.prevMousePosition.y, this.currentMousePosition.y, dt)
                            const matrix = new THREE.Matrix4()
                            matrix.makeRotationZ(this.paramsCircle['Rotation']*DEG2RAD)
                            matrix.setPosition(x,y,0)
                            this.circle.setMatrixAt(i + this.pointerCount, matrix)
                            this.circle.instanceMatrix.needsUpdate = true
                        }
                        
                    } else {
                        this.circle.count = 1
                        const matrix = new THREE.Matrix4()
                        matrix.makeRotationZ(this.paramsCircle['Rotation']*DEG2RAD)
                        matrix.setPosition(pointerWorldPos)
                        this.circle.setMatrixAt(0, matrix)
                        this.circle.instanceMatrix.needsUpdate = true
                    }
                    this.pointerCount += distance
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
        
        this.renderUp()
        this.setClearTempLayer()
    }

    renderUp(){
        this.core.renderer.autoClear = false
        
        this.core.renderer.setRenderTarget(this.rt)
        this.core.renderer.clearDepth()
        // console.log(this.core.params)

        // this.quad.material.opacity = 1.0
        // this.quad.material.needsUpdate = true
        this.quad.render(this.core.renderer)


        this.core.renderer.autoClear = true
    
        this.core.renderer.setRenderTarget(null)
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

        // quad.render(renderer) // что бы видеть прошлое что нарисовали 
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
