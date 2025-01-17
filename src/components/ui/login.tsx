import { useKeycloak } from "@react-keycloak/web";
// import keycloak from "../../services/keycloak";

export default function Login(){
    // const auth = useAuth();

    const { keycloak, initialized } = useKeycloak();

    console.log("login page rendered",keycloak.authenticated)
    return (
      <div className="flex justify items-center content-center gap-12 bg-customBlack h-screen w-screen px-16">
        <img src="/images/login-animation.gif" alt="accionlabs logo"
        className="w-[400px] h-[400px] rounded-full object-cover" />
        <div className="flex flex-col mb-20">
            <p className=" text-white text-2xl" >Welcome to</p>
            <h1 className="text-3xl font-bold text-white">Isometric Compiler</h1>

            <button className="bg-blue-700 px-4 py-2 mt-16 rounded text-white font-bold" onClick={() => keycloak.login({
                    prompt: 'login',
                    idpHint: 'google',
                  })}>Accion Labs</button>
        </div>
      </div>
        
    )
}