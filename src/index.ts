import express,{type Request, type Response} from 'express';
import path from 'node:path';

async function main() {
    const app = express();
    const PORT = 3000;
    const ISSUER = "http://localhost:3000";

    app.use(express.static(path.resolve("public")));    
    
    app.get('/', (req:Request,res:Response) => res.json({ message: "Hello from Auth Server" }));
    
    app.get('/health', (req:Request,res:Response) => res.json({ message: "Server is healthy", healthy: true }));

    
    app.get('/.well-known/openid-configuration', async (req:Request, res:Response) => {
        return res.status(200).json({
            "issuer":ISSUER,
            "authorization_url":`${ISSUER}/v1/authenticate/sign-in`,
            "userinfo_endpoint":`${ISSUER}/v1/userinfo`,
            "jwks_uri":`${ISSUER}/v1/jwks`,
        })
    })

    app.get('/v1/authenticate/sign-in', async (req,res) => {
        return res.sendFile(path.resolve("public", "SignIn.html"));
    })
   
    app.listen(PORT,() => {
        console.log(`Auth Server is running on port:${PORT}`)
    })
};

main();