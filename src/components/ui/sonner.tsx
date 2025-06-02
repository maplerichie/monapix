import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-black/95 group-[.toaster]:text-neon-green group-[.toaster]:border-neon-green group-[.toaster]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.7)] neon-border glow-effect",
          description: "group-[.toast]:text-neon-blue",
          actionButton:
            "group-[.toast]:bg-neon-green group-[.toast]:text-black neon-border glow-effect",
          cancelButton:
            "group-[.toast]:bg-black/80 group-[.toast]:text-neon-green neon-border glow-effect",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
