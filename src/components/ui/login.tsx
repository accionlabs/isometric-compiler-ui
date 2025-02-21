import { useKeycloak } from "@react-keycloak/web";
import { config } from "../../config";
// import keycloak from "../../services/keycloak";

export default function Login() {
    // const auth = useAuth();

    const { keycloak } = useKeycloak();

    return (
        <div className="flex justify-center items-center content-center gap-12 bg-customBlack h-screen w-screen px-16">
            <video
                autoPlay
                loop
                muted
                className="w-[70vh] h-[70vh] rounded-full object-cover"
                style={{ filter: "brightness() contrast() opacity()" }}
            >
                <source src="/video/Isometric.mp4" type="video/mp4" />
            </video>
            <div className="flex flex-col mb-20">
                <p className=" text-white text-2xl">Welcome to</p>
                <h1 className="text-3xl font-bold text-white">
                    Isometric Compiler
                </h1>

                <button
                    className="bg-blue-700 px-4 py-2 mt-16 rounded text-white font-bold"
                    onClick={() => {
                        keycloak.login({
                            prompt: "login",
                            idpHint: config.microsoftLoginHint
                        });
                    }}
                >
                    Accion Labs
                </button>
            </div>
        </div>
    );
}
