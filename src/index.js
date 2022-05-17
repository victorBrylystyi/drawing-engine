// import React from 'react'
// import ReactDOM from 'react-dom/client'
import './css/index.css'
// import app from './fast'
import App from './fast'

// import App from './components/App'

// const root = ReactDOM.createRoot(document.getElementById('root'))

// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// )

// app()

const app = new App(document.querySelector('#root'))
app.init()

