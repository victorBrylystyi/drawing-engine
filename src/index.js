// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import produce from 'immer'
import { animationFrameScheduler, BehaviorSubject, distinct, distinctUntilChanged, map, observeOn, pairwise, Subject } from 'rxjs'
import { MathUtils } from 'three'
import './css/index.css'
// import app from './fast'
import LoadApp from './fast'



// import App from './components/App'

// const root = ReactDOM.createRoot(document.getElementById('root'))

// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// )

// app()

const startApp = new LoadApp(document.querySelector('#root'))
startApp.init()


// const store = new BehaviorSubject({
//         name:'Canva 1',
//         strokes: [{     // onMouseUp
//             color:0x00,
//             id: '1',
//             attributes:{    
//                 position:[],
//                 tilt:[],
//                 pressure:[]
//             }
//         }],
//         position: [1,1,1]
//     }
// )


// store
// .pipe(
//     distinct(layer => layer.strokes),
//     pairwise(),
//     observeOn(animationFrameScheduler)
// )
// .subscribe((store) => { 
//     console.log(store)
// })

// store.next({
//     name:'Canva 2',
//     strokes: [4],// mouseUp
//     position: [1,1,1]
// })

// store.next({
//     ...store.value,
//     name:'Canva 3',
//     position: [1,1,2]
// })


// const stroke = new Subject()

// // mouseMove -> []

// stroke
// .pipe(
//     observeOn(animationFrameScheduler)
// )
// .subscribe((stroke) => { 

//     console.log(stroke) // render 

//     const nextState = produce(
//         store.value, 
//         draftState => {

//             if (draftState.strokes.length === 0){
//                 draftState.strokes.push({
//                     color:0x00,
//                     id: '1',
//                     attributes:{    
//                         position:[],
//                         tilt:[],
//                         pressure:[]
//                     }
//                 })
//             }

//             const currentStroke = draftState.strokes[draftState.strokes.length-1]

//             currentStroke.attributes.position.push(...stroke.positions)


//         }
//     )

//     store.next(nextState)

// })

// stroke.next([])



 
// test  store 

// const store = new BehaviorSubject({
//     strokes:[]
// })


// const currentStroke = new BehaviorSubject({
//     id: null,
//     positions:[],
//     startPoint:0
// })

// currentStroke
// .pipe(
//     observeOn(animationFrameScheduler)
// )
// .subscribe(currentStroke => console.log('change current stroke', currentStroke))

// store
// .pipe(
//     map(store => store.strokes),
//     distinctUntilChanged()
// )
// .subscribe(()=>{
//     currentStroke
//     .next({
//         ...currentStroke.value,
//         positions:[],
//         startPoint:0
//     })
// })

// store
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

//         if (lastStroke.id === currentStroke.value.id) return 

//     }

//     console.log('render')

//     // render nextStrokes
// })


// currentStroke      // mouseDown
// .next({
//     id:MathUtils.generateUUID(),
//     positions:[],
//     startPoint: 0
// })


// currentStroke      // mouseMove 
// .next({
//     ...currentStroke.value,
//     positions:[...currentStroke.value.positions, 2, 5],
//     startPoint: currentStroke.value.positions.length
// })

// currentStroke   // mouseMove 
// .next({ 
//     ...currentStroke.value,
//     positions:[...currentStroke.value.positions, 5, 1],
//     startPoint: currentStroke.value.positions.length
// })

// currentStroke   // mouseMove 
// .next({
//     ...currentStroke.value,
//     positions:[...currentStroke.value.positions, 6, 9],
//     startPoint: currentStroke.value.positions.length
// })


// store // mouseUp
//     .next({
//         strokes: [...store.value.strokes, {
//             id:currentStroke.value.id,
//             positions: currentStroke.value.positions
//         }]
//     }
// )

// store // change store 
//     .next({
//         strokes: [...store.value.strokes, {
//             id: 'new',
//             positions: currentStroke.value.positions
//         }]
//     }
// )


// store // change store 
//     .next({
//         strokes: [...store.value.strokes, {
//             id: 'new2',
//             positions: currentStroke.value.positions
//         }]
//     }
// )

// store // change store 
//     .next({
//         strokes: [...store.value.strokes, {
//             id: 'new3',
//             positions: currentStroke.value.positions
//         }]
//     }
// )

