export default function InputBox({placeholder = "", type = "text", margin = "m-3"}) {
    return (
        <input 
            className={`input ${margin}`}
            type={type} 
            placeholder={placeholder}
        />
    );
}