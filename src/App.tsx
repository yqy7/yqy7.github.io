import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center justify-center gap-8">
        <img src={heroImg} className="size-40 object-contain" alt="hero" />
        <img src={viteLogo} className="size-40 object-contain" alt="vite" />
        <img src={reactLogo} className="size-40 object-contain" alt="react" />
      </div>
    </div>
  )
}

export default App
