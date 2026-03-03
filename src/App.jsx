
import { Routes ,Route} from 'react-router-dom'
import CodePage from './pages/Code'
import Home from './pages/Home'
import AboutPage from './pages/About'
function App() {
 

  return (
   <Routes>
    <Route path="/" element={<Home/>}/>
    <Route path='/code' element={<CodePage/>}/>
     <Route path='/about' element={<AboutPage/>}/>
   </Routes>
  )
}

export default App
