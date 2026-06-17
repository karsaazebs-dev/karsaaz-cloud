import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const imgCloud = 'https://www.figma.com/api/mcp/asset/89e1c81b-80ba-42dd-8728-b0715cc12214'
const imgPackageOpen = 'https://www.figma.com/api/mcp/asset/a5b0b9db-c056-437f-9469-43f98dc1837d'

export default function SplashScreen(): JSX.Element {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const checkOnboarded = async () => {
      const onboarded = await window.api.store.get('onboarded')
      const serverUrl = await window.api.store.get('serverUrl')

      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 2, 100))
      }, 40)

      setTimeout(() => {
        clearInterval(interval)
        setProgress(100)
        setTimeout(() => {
          if (onboarded && serverUrl) {
            navigate('/app/dashboard')
          } else {
            navigate('/onboarding/1')
          }
        }, 100)
      }, 2000)

      return () => clearInterval(interval)
    }

    checkOnboarded()
  }, [navigate])

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center bg-white">
      {/* Progress bar at top */}
      <div className="absolute top-0 left-0 right-0 h-[4px] bg-[#ecf1ff]">
        <div
          className="h-full bg-[#3d7bff] transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Center content */}
      <div className="flex flex-col items-center gap-8">
        {/* App icon tile */}
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-[24px] bg-white shadow-[0px_8px_12px_rgba(0,0,0,0.06)]">
          <div className="relative flex h-[58px] w-[58px] flex-col items-center justify-center">
            <div className="relative h-[40.6px] w-[58px]">
              <img alt="" className="absolute inset-0 block h-full w-full" src={imgCloud} />
            </div>
            <div className="absolute bottom-[4px] left-1/2 flex h-[34px] w-[34px] -translate-x-1/2 items-center justify-center">
              <img alt="" className="absolute inset-0 block h-full w-full" src={imgPackageOpen} />
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-3">
          <p className="font-display text-2xl font-bold leading-normal text-[#101010]">Storage.io</p>
          <p className="font-sans text-base font-normal leading-normal text-[#6b7280]">
            Your Files, Your Cloud, Your Control
          </p>
        </div>
      </div>
    </div>
  )
}
