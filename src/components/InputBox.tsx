import type { ChangeEvent } from "react";

interface InputBoxProps {
    placeholder: string
    type: string
    margin?: string
    value: string
    onChange: (e: ChangeEvent<HTMLInputElement>) => void

}

export default function InputBox({placeholder = "", type = "text", margin = "m-3", value = "", onChange}: InputBoxProps) {
    return (
        <input 
            className={`input ${margin}`}
            type={type} 
            placeholder={placeholder}
            value={value}
            onChange={onChange}
        />
    );
}