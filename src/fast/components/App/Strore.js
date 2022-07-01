
import DrawingStore from "../Store";

class Store extends DrawingStore {

    activeCanva = null
    past = []
    current = {}
    future = []


    constructor(){
        super('appStore')
    }

    setActiveCanva(name = null){
        this.activeCanva = name 

        this.dispatchEvent({
            type:'onUpdateActiveCanva',
            name: this.activeCanva
        })
    }


}

export default Store