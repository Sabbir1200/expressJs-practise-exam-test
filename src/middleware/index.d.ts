import type { JwtPayload } from "jsonwebtoken";


export interface TCustomUser extends JwtPayload {
    id: number;
    role: "maintainer" | "contributor";
    email?: string;
}

declare global {
    namespace Express {
        interface Request {
            
            user?: TCustomUser; 
        }
    }
}