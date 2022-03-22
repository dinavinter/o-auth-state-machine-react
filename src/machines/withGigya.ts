import {
    getAccount,
    getJwt,
    logout,
    performSignin,
    performSignup,
    socialLoginAsync,
    SocialLoginParams
} from "../gigya/gigyaAuthMachine";
import {omit} from "lodash/fp";
import {AuthMachine, loginMachine, SocialEvent, SocialPayload} from "./authMachine";
import {assign, spawn} from "xstate";

function toMfa(tokenDetails: any) {
    const forMfa = tokenDetails.sub_id;
    forMfa.authTime = tokenDetails.authTime;
    forMfa.iat = tokenDetails.iat;
    forMfa.exp = tokenDetails.iat;
    return forMfa;
}

export const withGigya= (authMachine:AuthMachine)=>authMachine.withConfig({
    services: {
        performSignup: async (ctx, event) => {
            const payload = omit("type", event);
            return await performSignup(payload)
        },
        performLogin: async (ctx, event) => {
            const payload = omit("type", event);
            const loginMode =ctx.user? "reAuth" : "standard"
            return await performSignin({...payload, loginMode})
        },
        getToken: async (ctx, event) => {
            const payload = omit("type", event);
            const idToken = await getJwt(payload);
            const tokenDetails= decodeJwt(idToken as string);
            const forMfa = toMfa(tokenDetails);

            const mfaToken = decodeJwt(idToken as string);
            mfaToken.sub_id= null;
            mfaToken.sub_ids = [forMfa];
            
            return { idToken: {raw: idToken, details:tokenDetails}, mfaToken};
        },

        enrichToken: async (ctx, event) => {
            const payload = omit("type", event);
            const idToken = await getJwt(payload);
            const tokenDetails= decodeJwt(idToken as string); 
            const mfaToken = ctx.mfaToken;
            const forMfa = toMfa(tokenDetails);
            mfaToken.sub_ids = [...mfaToken.sub_ids, forMfa];
             return { idToken:  {raw: idToken, details:tokenDetails}, mfaToken};

            function decodeJwt(token?:string) {

                return token && token.split && JSON.parse(atob(token.split('.')[1]));

            }  
            function encodeJwt(token?:object) {
                const unsignedToken = Buffer.from('').toString('base64') + "." +  Buffer.from(JSON.stringify(token)).toString('base64')
 
                return  unsignedToken;

            }

            
        },
        performSocialLogin: async (ctx, event) => {
            if (event.type == "SOCIAL") {
                const payload = omit("type", event);
                const loginMode =ctx.user? "reAuth" :  "standard"

                return await  socialLoginAsync({...payload, loginMode} as SocialLoginParams);
            }

        },
        getUserProfile: async (ctx, event) => {
            const payload = omit("type", event);
            const user = await getAccount(payload);
            return {user:{ ...user || {}, email: user?.profile?.email}}
        },
        performLogout: async (ctx, event) => {
            localStorage.removeItem("authState");
            return await logout();
        },
        /*'login-service':loginMachine.withConfig({
            services:{
                performSignup: async (ctx, event) => {
                    const payload = omit("type", event);
                    return await performSignup(payload)
                },
                performLogin: async (ctx, event) => {
                    const payload = omit("type", event);
                    const loginMode =ctx.user? "reAuth" : "standard"
                    return await performSignin({...payload, loginMode})
                },
                performSocialLogin: async (ctx, event) => {
                    if (event.type == "SOCIAL") {
                        const payload = omit("type", event);
                        const loginMode =ctx.user? "reAuth" :  "standard"

                        return await  socialLoginAsync({...payload, loginMode} as SocialLoginParams);
                    }

                },
            }
        })*/
    },
    actions: {
        // assignLoginService:assign({
        //     loginService:(context) => spawn(loginMachine.withConfig({
        //         services:{
        //             performSignup: async (ctx, event) => {
        //                 const payload = omit("type", event);
        //                 return await performSignup(payload)
        //             },
        //             performLogin: async (ctx, event) => {
        //                 const payload = omit("type", event);
        //                 const loginMode =ctx.user? "reAuth" : "standard"
        //                 return await performSignin({...payload, loginMode})
        //             },
        //             performSocialLogin: async (ctx, event) => {
        //                 if (event.type == "SOCIAL") {
        //                     const payload = omit("type", event);
        //                     const loginMode =ctx.user? "reAuth" :  "standard"
        //
        //                     return await  socialLoginAsync({...payload, loginMode} as SocialLoginParams);
        //                 }
        //
        //             },
        //         }
        //     }))
        // })
        // onUnauthorizedEntry: async (ctx, event) => {
        //     if (history.location.pathname !== "/signin") {
        //         /* istanbul ignore next */
        //         history.push("/signin");
        //     }
        // },
        // onAuthorizedEntry: async (ctx, event) => {
        //     if (history.location.pathname === "/signin") {
        //         /* istanbul ignore next */
        //         history.push("/");
        //     } else {
        //         history.push(
        //             `/profile`
        //         );
        //     }
        //
        // },
    }
});

function decodeJwt(token?:string) {

    return token && token.split && JSON.parse(atob(token.split('.')[1]));

}  