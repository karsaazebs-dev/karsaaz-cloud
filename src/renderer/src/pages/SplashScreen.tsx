import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SplashScreen(): JSX.Element {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const checkOnboarded = async () => {
      const onboarded = await window.api.store.get('onboarded')
      const serverUrl = await window.api.store.get('serverUrl')
      const authToken = await window.api.store.get('authToken')

      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 2, 100))
      }, 40)

      setTimeout(() => {
        clearInterval(interval)
        setProgress(100)
        setTimeout(() => {
          if (onboarded && serverUrl && authToken) {
            navigate('/app/dashboard')
          } else if (onboarded && serverUrl) {
            navigate('/auth/login')
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
      <div className="absolute top-0 left-0 right-0 h-[4px] bg-[#ecf1ff]">
        <div
          className="h-full bg-[#3d7bff] transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-col items-center gap-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-[24px] bg-white shadow-[0px_8px_12px_rgba(0,0,0,0.06)]">
          <div className="flex h-[50px] w-[50px] items-center justify-center rounded-[14px] bg-[#2B7FFF]">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 3C9.582 3 6 6.582 6 11c0 1.29.31 2.508.858 3.577C4.07 15.26 2 17.73 2 20.5 2 23.538 4.462 26 7.5 26h13c3.038 0 5.5-2.462 5.5-5.5 0-2.77-2.07-5.24-4.858-5.923A7.98 7.98 0 0 0 22 11c0-4.418-3.582-8-8-8z" fill="white" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="font-display text-2xl font-bold leading-normal text-[#101010]">Karsaaz Cloud</p>
          <p className="font-sans text-base font-normal leading-normal text-[#6b7280]">
            Your Files, Your Cloud, Your Control
          </p>
        </div>
      </div>
    </div>
  )
}
