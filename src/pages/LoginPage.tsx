import { useState, type ChangeEvent, type SubmitEvent } from "react"
import { InputBox, Button } from "../components"
import { useNavigate } from "react-router-dom";

function sleep(n = 0): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, n))
}

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const isDisabled = username.trim() === "" || password.trim() === ""

    const [isLoading, setIsLoading] = useState(false)

    const navigate = useNavigate();

    async function waitSeconds() {
        await sleep(5000)
    }

    const signInAction = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            await waitSeconds();
        } finally {
            setIsLoading(false)
        }

        navigate("/dashboard");
    }

    return (
        <form onSubmit={signInAction}>
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
                    isLoading={isLoading}
                ></Button>
            </div>
        </form>
    )
}