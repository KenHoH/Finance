import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Observable } from "rxjs";

@Injectable()
export class JwtAuthGuard implements CanActivate{
    constructor(private readonly jwtService: JwtService) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const req = context.switchToHttp().getRequest();
        const token = req.cookies?.['token'];

        if(!token){
            throw new UnauthorizedException('not loggeed in');
        }

        try{
            const payload = this.jwtService.verify(token);
            req.user = payload;
            return true;
        }catch{
            throw new UnauthorizedException('invalid or expired token')
        }
    }

}