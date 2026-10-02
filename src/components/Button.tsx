import type { MouseEventHandler } from "react"

interface ButtonProps {
    text: string
    isDisabled: boolean
    action?: MouseEventHandler<HTMLButtonElement>
}

export default function Button ({text = "sample", action, isDisabled = false }: ButtonProps) {
    return (
        <button 
            className="btn btn-soft btn-primary btn-xs sm:btn-sm md:btn-md lg:btn-lg xl:btn-lg"
            onClick={action}
            disabled={isDisabled}
        >
            {text}
        </button>
    )
}