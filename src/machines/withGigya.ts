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
import {AuthMachine, SocialEvent, SocialPayload} from "./authMachine";

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
            const idToken = await getJwt(payload);
            return {user:{ ...user || {}, email: user?.profile?.email}, idToken}
        },
        performLogout: async (ctx, event) => {
            localStorage.removeItem("authState");
            return await logout();
        },
    },
    actions: {
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