import type { MouseEventHandler } from "react"

interface ButtonProps {
    text: string
    isDisabled?: boolean
    isLoading?: boolean
    action?: MouseEventHandler<HTMLButtonElement>
}

export default function Button ({text = "sample", action, isDisabled = false, isLoading = false }: ButtonProps) {
    return (
        <button 
            className="btn btn-soft btn-primary btn-xs sm:btn-sm md:btn-md lg:btn-lg xl:btn-lg"
            onClick={action}
            disabled={isDisabled || isLoading}
        >
            {isLoading ? <span className="loading loading-dots loading-sm"></span> : text}
            
        </button>
    )
}