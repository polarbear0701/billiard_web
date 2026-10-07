import { useState, type ChangeEvent, type SubmitEvent } from "react"
import { InputBox, Button } from "../components"
import { useNavigate } from "react-router-dom";
import { login } from "../services/auth";
import { getErrorMessage } from "../services/http";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const isDisabled = username.trim() === "" || password.trim() === ""
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const navigate = useNavigate();


    const signInAction = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")
        try {
            const {accessToken, refreshToken} = await login(username, password)
            localStorage.setItem("accessToken", accessToken)
            localStorage.setItem("refreshToken", refreshToken)
            navigate("/dashboard", {replace: true})
        } catch (err) {
            setError(getErrorMessage(err))
        }
        finally {
            setIsLoading(false)
        }
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

                {error && <p className="text-red-500">{error}</p>}
            </div>
        </form>
    )
}