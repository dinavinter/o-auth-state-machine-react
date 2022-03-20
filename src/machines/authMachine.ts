// import dotenv from "dotenv";
import {Machine, assign, interpret, State, AnyState, InterpreterFrom,   actions, send} from "xstate";
import {User, IdToken} from "../models";
import {backendPort} from "../utils/portUtils";
import {
    getAccount,
    getJwt,
    logout,
    performSignin,
    performSignup,
    socialLogin,
    socialLoginAsync
} from "../gigya/gigyaAuthMachine";
const {log, resolveSend, forwardTo} =actions;
// dotenv.config();
export interface AuthMachineSchema {
    states: {
        unauthorized: {};
        signup: {};
        login: {};
        social: {};
        updating: {};
        logout: {};
        refreshing: {};
        authorized: {};
        reauth: {};
    };
}

export interface SocialPayload {
    provider: string,
    [key: string]: any
}

export type SocialEvent = SocialPayload & { type: "SOCIAL" };
export type AuthMachineEvents =
    | { type: "LOGIN" }
    | SocialEvent
    | { type: "LOGOUT" }
    | { type: "UPDATE" }
    | { type: "REFRESH" }
    | { type: "SIGNUP" }
    | { type: "REAUTH" };

export interface AuthMachineContext {
    user?: User;
    idToken?: IdToken;
    message?: string;
}

export const authMachine = Machine<AuthMachineContext, AuthMachineSchema, AuthMachineEvents>(
    {
        id: 'auth',
        initial: "unauthorized",
        context: {
            user: undefined,
            idToken: undefined,
            message: undefined,
        },
        states: {
            unauthorized: {
                entry: ["resetUser", "onUnauthorizedEntry", log('unauthorized')],
                on: {
                    LOGIN: "login",
                    SOCIAL: "social",
                    SIGNUP: "signup"
                },
            },
           
            signup: {
                entry: log('signup'),

                invoke: {
                    src: "performSignup",
                    onDone: {target: "unauthorized", actions: "onSuccess"},
                    onError: {target: "unauthorized", actions: "onError"},
                },
            },
            login: {
                invoke: {
                    src: "performLogin",
                    onDone: {target: "authorized", actions: "onSuccess"},
                    onError: {target: "unauthorized", actions: "onError"},
                },
            },
            social: {
                entry: log('social'),
                invoke: {
                    src: "performSocialLogin",
                    onDone: {target: "refreshing", actions: "onSuccess"},
                    onError: {target: "unauthorized", actions: "onError"},
                },
            },
            updating: {
                entry: log('updating'),
                invoke: {
                    src: "updateProfile",
                    onDone: {target: "refreshing"},
                    onError: {target: "unauthorized", actions: "onError"},
                },
            },
            refreshing: {
                entry: log('refreshing'),

                invoke: {
                    src: "getUserProfile",
                    onDone: {target: "authorized", actions: "setUserProfile"},
                    onError: {target: "unauthorized", actions: ["onError", "logEventData"]},
                },
                on: {
                    LOGOUT: "logout",
                },
            },
            logout: {
                entry: log('logout'),

                invoke: {
                    src: "performLogout",
                    onDone: {target: "unauthorized"},
                    onError: {target: "unauthorized", actions: "onError"},
                },
            },
            authorized: {
                entry: [log("authorized"), "onAuthorizedEntry", ""],
                on: {
                    UPDATE: "updating",
                    REFRESH: "refreshing",
                    LOGOUT: "logout",
                    REAUTH: "reauth",
                },
            },
            reauth: {
                entry: [ "onReauthEntry", log('reauth')],
                on: {
                    LOGIN: 'login',
                    SOCIAL: "social",
                    SIGNUP: "signup"
                },
            },

        },
    },
    {

        actions: {
            logEventData: {
                type: 'xstate.log',
                label: 'Finish label',
                expr: (context:any, event:any) => event.data
            },
            onAuthorizedEntry: async (ctx, event) => {


            },
            resetUser: assign((ctx: any, event: any) => ({
                user: undefined,
                idToken: undefined
            })),
            setUserProfile: assign((ctx: any, event: any) => ({
                user: event.data.user,
                idToken: event.data.idToken,
            })),
            onSuccess: assign((ctx: any, event: any) => ({
                user: event.data.user,
                message: undefined,
            })),
            onError: assign((ctx: any, event: any) => ({
                message: event.data.message,
            })),
        },
    }
);

export type AuthMachine = typeof authMachine;


// export const authService = interpret(authMachine)
//     .onTransition((state) => {
//         if (state.changed) {
//             localStorage.setItem("authState", JSON.stringify(state));
//         }
//     })
//     .start(resolvedState);
//
// authService.subscribe((state => console.log(state)));
export type AuthService = InterpreterFrom<AuthMachine>;