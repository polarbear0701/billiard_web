import { useState, type ChangeEvent } from "react"
import { InputBox, Button } from "../components"

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const isDisabled = username.trim() === "" || password.trim() === ""

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <title>Login</title>
            <h1 className="font-bold text-xl">Login</h1>
            <InputBox
                placeholder="Username"
                type="text"
                value={username}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
            ></InputBox>

            <InputBox
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            ></InputBox>

            <Button
                text="Sign In"
                isDisabled={isDisabled}
            ></Button>
        </div>
    )
}