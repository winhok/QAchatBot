import { useSyncExternalStore } from 'react'
import { getTimeGreeting } from './welcome/constants'

export function WelcomeScreen() {
  const timeGreeting = useSyncExternalStore(
    () => () => {},
    () => getTimeGreeting(),
    () => '你好',
  )

  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 select-none">
      {/* Giant headline - Exaggerated Minimalism */}
      <h1 className="text-[clamp(2.5rem,8vw,5rem)] font-black tracking-tight text-foreground text-center leading-[1.1]">
        {timeGreeting}，
        <br />
        <span className="text-primary">聊点什么？</span>
      </h1>

      {/* Minimal subtext */}
      <p className="mt-6 text-lg text-muted-foreground text-center max-w-md">
        对话即能力。问我任何问题。
      </p>
    </div>
  )
}
