import { InputBox } from "../components"

export default function LoginPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <title>Login</title>
            <h1 className="font-bold text-xl">Login</h1>
            <InputBox
                placeholder="Username"
                type="text"
            ></InputBox>

            <InputBox
                placeholder="Password"
                type="password"
            ></InputBox>
        </div>
    )
}