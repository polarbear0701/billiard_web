import { useState, type ChangeEvent, type SubmitEvent } from "react"
import { InputBox, Button } from "../components"
import { Navigate, useNavigate } from "react-router-dom";
import { hasActiveSession, login } from "../services/auth";
import { useLanguage } from "../i18n/useLanguage";
import LanguageToggle from "../components/LanguageToggle";
import logo from "../assets/optimized/logo.png";
import { getErrorMessage } from "../services/http";

export default function LoginPage() {
    const { t } = useLanguage()
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
            navigate("/table", {replace: true})
        } catch (err) {
            setError(getErrorMessage(err))
        }
        finally {
            setIsLoading(false)
        }
    }

    if (hasActiveSession()) {
        return <Navigate to="/table" replace />
    }

    return (
        <form onSubmit={signInAction}>
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="absolute right-4 top-4">
                    <LanguageToggle />
                </div>
                <title>{t.login.title}</title>
                <img src={logo} alt="Bida 298" className="mb-4 h-24" />
                <h1 className="font-bold text-xl">{t.login.title}</h1>
                <InputBox
                    placeholder={t.login.username}
                    type="text"
                    value={username}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                ></InputBox>

                <InputBox
                    placeholder={t.login.password}
                    type="password"
                    value={password}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                ></InputBox>

                <Button
                    text={t.login.submit}
                    isDisabled={isDisabled}
                    isLoading={isLoading}
                ></Button>

                {error && <p className="text-red-500">{error}</p>}
            </div>
        </form>
    )
}