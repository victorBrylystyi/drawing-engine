import { EventDispatcher } from "three"

const initinal = {
    id: '',
    attributes:{
        position:[],
        pressure: [],
        tilt:[],
    }, 
    brush: '',
    grain: '',
    canvaName:'',
    size: 0,
    brushColor: {
        r:0,
        g:0,
        b:0,
        a:1,
    }, 
    opacity: 1,
}

class DrawingStore extends EventDispatcher{

    strokes = []
    current = JSON.parse(JSON.stringify({...initinal}))

    constructor(name = ''){
        super()
        this.name = name || 'store'
    }

    getInitStore(){
        return JSON.parse(JSON.stringify({...initinal}))
    }

    getCopyStore(){
        return JSON.parse(JSON.stringify(this))
    }

    setCurrentAttributes(attributes){

        for (const attribute in attributes){

            if (this.current.attributes[attribute] !== undefined) this.current.attributes[attribute].push(attributes[attribute])
            
        }

    }

    setCurrent(props = JSON.parse(JSON.stringify({...initinal}))){
        this.current = {...props}
    }
 
    _clearCurrent(){
        this.current = JSON.parse(JSON.stringify({...initinal}))
    }

    setStroke(){
        this.strokes = [...this.strokes, JSON.parse(JSON.stringify({...this.current}))]
        this._clearCurrent()

        this.dispatchEvent({
            type:'onSaveStroke',
            strokes:[...this.strokes]
        })

        this.dispatchEvent({
            type:'onUpdateStore',
            store: this.getCopyStore()
        })

    }
    

}

export default DrawingStore