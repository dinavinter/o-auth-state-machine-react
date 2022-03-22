// import dotenv from "dotenv";
import {Machine, assign, interpret, State, AnyState, InterpreterFrom, actions, send, StateMachine, spawn} from "xstate";
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
import {ActorRefFrom} from "xstate/lib/types";

const {log, resolveSend, forwardTo} = actions;

// dotenv.config();
export interface AuthMachineSchema {
    states: {
        unauthorized: {};
        login: {};
        logout: {};
        refreshing: {};
        authorized: {};
        reauth: {};
        error: {};
        token: {};
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
    | { type: "REAUTH" }
    | { type: "PASSWORD" }
    | { type: "TOKEN", token: Token };

export interface Token {
    access_token?: string;
    refresh_token?: string;
    id_token?: string;
}

export interface AuthMachineContext {
    user?: User;
    idToken?: IdToken;
    token?: Token;
    mfaToken?: any;
    message?: string;
    // loginService: any
}

export interface LoginMachineSchema {
    states: {
        signup: {};
        password: {};
        social: {};
        // token: {};
        authorized: {};
        error: {};
    };
}

export type LoginMachineEvents =
    | SocialEvent
    | { type: "SIGNUP" }
    | { type: "PASSWORD" };

export interface LoginMachineContext {
    user?: User;
    message?: string;
    token?: Token;

}

export const loginMachine = Machine<LoginMachineContext, LoginMachineSchema, LoginMachineEvents>({
        id: 'login',
        on: {
            PASSWORD: "password",
            SOCIAL: "social",
            SIGNUP: "signup"
        },
        states: {
            social: {
                entry: log('social'),
                invoke: {
                    src: "performSocialLogin",
                    onDone: {target: "authorized", actions: "onSuccess"},
                    onError: {target: "error", actions: ["onError", "logEventData"]},
                },
            },
            password: {
                invoke: {
                    src: "performLogin",
                    onDone: {target: "authorized", actions: "onSuccess"},
                    onError: {target: "error", actions: ["onError", "logEventData"]},
                }
            },
            signup: {
                entry: log('signup'),

                invoke: {
                    src: "performSignup",
                    onDone: {target: "authorized", actions: "onSuccess"},
                    onError: {target: "error", actions: ["onError", "logEventData"]},
                },
            },

            authorized: {
                entry: [log("authorized"), "onAuthorizedEntry"],
                type: "final",
                data: (ctx, _) => ctx
            },
            error: {
                entry: [log("authorized"), "onAuthorizedEntry"],
                type: "final",
                data: (ctx, _) => ctx
            }
        }
    }, {
        actions: {
            onSuccess: assign((ctx: any, event: any) => ({
                user: event.data.user,
                message: undefined,
            })),
            logEventData: {
                type: 'xstate.log',
                label: 'Finish label',
                expr: (context: any, event: any) => event.data
            },

            setToken: assign((ctx: any, event: any) => ({
                token: {
                    id_token: event.data.idToken,
                    access_token: event.data.access_token,
                    refresh_token: event.data.refresh_token,
                }
            })),

            onError: assign((ctx: any, event: any) => ({
                message: event.data.message,
            })),
        }
    }
);

export interface TokenMachineSchema {
    states: {
        not_authenticated: {};
        authenticated: {};
        getToken: {};
        enrichToken: {};
        revokeToken: {};
    };
}

export type TokenMachineEvents =
    | { type: "AUTHRESPONSE" }
    | { type: "REFRESH" }
    | { type: "REVOKE" };

// const tokenState= {
//
//     onDone: {target: 'authorized'},
//
//     on:{
//         '': [
//             { target: '.getToken', cond: context => !context.token},
//             { target: '.enrichToken', cond: context => context.token !== undefined}
//         ],
//
//     },
//     states:{
//         getToken:{
//             invoke: {
//                 src: "getToken",
//                 onDone: [
//                     { target: 'authorized', actions: "setToken"},
//                     // {target: 'authorized', actions: "enrichToken", cond: context => context.token !== undefined}
//                 ],
//                 onError: {target: "error", actions: ["onError", "logEventData"]},
//             },
//
//
//         },
//         enrichToken: {
//             invoke: {
//                 src: "enrichToken",
//                 onDone: {target: 'authorized', actions: "setToken"},
//                 onError: {target: "error", actions: ["onError", "logEventData"]},
//             }
//
//         },
//         error: {
//             entry: [log("authorized"), "onAuthorizedEntry"],
//             type: "final"
//
//         },
//         authorized: {
//             entry: [log("authorized"), "onAuthorizedEntry"],
//             type: "final"
//
//         }
//
//     }
// }
export const tokenMachine= Machine<Token, TokenMachineSchema, TokenMachineEvents>({
    id: 'token',
    initial: "not_authenticated",
    states:{
        not_authenticated:{
            on:{
                "AUTHRESPONSE": '.enrichToken'
            }
        },

        authenticated:{
            on:{
                "AUTHRESPONSE": '.getToken'
            }
        },

        getToken:{
            invoke: {
                src: "getToken",
                onDone: [
                    { actions: "setToken"},
                    // {target: 'authorized', actions: "enrichToken", cond: context => context.token !== undefined}
                ],
                onError: {target: "error", actions: ["onError", "logEventData"]},
            },


        },
        enrichToken: {
            invoke: {
                src: "enrichToken",
                onDone: {target:'authenticated', actions: ["setToken", "sendTokenResponse"]},
                onError: {target: "error", actions: ["onError", "logEventData"]},
            }

        },   
        revokeToken: {
            invoke: {
                src: "revokeToken",
                onDone: {target:'not_authenticated', actions: ["setToken", "sendTokenResponse"]},
                onError: {target: "error", actions: ["onError", "logEventData"]},
            }

        },
       

    }

})

export const authMachine = Machine<AuthMachineContext, AuthMachineSchema, AuthMachineEvents>(
    {
        id: 'auth',
        initial: "unauthorized",
        context: {
            user: undefined,
            idToken: undefined,
            token: undefined,
            message: undefined,
            // loginService: loginMachine

        },
        states: {
            unauthorized: {
                entry: ["resetUser", "onUnauthorizedEntry", log('unauthorized')],
                on: {
                    LOGIN: "login"
                },
            },
            login: {
                entry: ['onLoginEntry', 'assignLoginService', log('login')],
                onDone: [{target: "token.exchange", actions: "setLoginResponse"}],
                on: {
                    PASSWORD: ".password",
                    SOCIAL: ".social",
                    SIGNUP: ".signup"
                },
                states: {
                    social: {
                        entry: log('social'),
                        invoke: {
                            src: "performSocialLogin",
                            onDone: {target: "authorized", actions: "onSuccess"},
                            onError: {target: "error", actions: ["onError", "logEventData"]},
                        },
                    },
                    password: {
                        invoke: {
                            src: "performLogin",
                            onDone: {target: "authorized", actions: "onSuccess"},
                            onError: {target: "error", actions: ["onError", "logEventData"]},
                        }
                    },
                    signup: {
                        entry: log('signup'),

                        invoke: {
                            src: "performSignup",
                            onDone: {target: "authorized", actions: "onSuccess"},
                            onError: {target: "error", actions: ["onError", "logEventData"]},
                        },
                    },

                    authorized: {
                        entry: [log("authorized"), "onAuthorizedEntry"],
                        type: "final"

                    },
                    error: {
                        entry: [log("authorized"), "onAuthorizedEntry"],
                        type: "final"

                    }
                },
                invoke: {
                    src: 'login-service',
                    id: 'loginService',

                    data: {
                        token: (context: AuthMachineContext, _event: any) => context.token
                    },
                    onDone: {target: "token", actions: "setLoginResponse"},
                    onError: {target: "unauthorized", actions: ["onError", "logEventData"]},

                },

            },
            token: {

                onDone: {target: 'authorized'},
  
                states:{
                    exchange:{
                        
                        invoke: {
                            src: "getToken",
                            onDone: [
                                { target: '#authorized', actions: "setToken"},
                                // {target: 'authorized', actions: "enrichToken", cond: context => context.token !== undefined}
                            ],
                            onError: {target: "error", actions: ["onError", "logEventData"]},
                        },
                      

                    },
                    enrich: {
                        invoke: {
                            src: "enrichToken",
                            onDone: {target: '#authorized', actions: "setToken"},
                            onError: {target: "error", actions: ["onError", "logEventData"]},
                        }   

                    },
                    error: {
                        entry: [log("authorized"), "onAuthorizedEntry"],
                        type: "final"

                    },
                    authorized: {
                        entry: [log("authorized"), "onAuthorizedEntry"],
                        type: "final"

                    }
                    
                }
            },
            reauth: {
                entry: ["onReauthEntry", log('reauth')],
                onDone: [{target: "token.enrich", actions: "setLoginResponse"}],

                on: {
                    PASSWORD: ".password",
                    SOCIAL: ".social",
                    SIGNUP: ".signup"
                },
                states: {
                    social: {
                        entry: log('social'),
                        invoke: {
                            src: "performSocialLogin",
                            onDone: {target: "authorized", actions: "onSuccess"},
                            onError: {target: "error", actions: ["onError", "logEventData"]},
                        },
                    },
                    password: {
                        invoke: {
                            src: "performLogin",
                            onDone: {target: "authorized", actions: "onSuccess"},
                            onError: {target: "error", actions: ["onError", "logEventData"]},
                        }
                    },
                    signup: {
                        entry: log('signup'),

                        invoke: {
                            src: "performSignup",
                            onDone: {target: "authorized", actions: "onSuccess"},
                            onError: {target: "error", actions: ["onError", "logEventData"]},
                        },
                    },

                    authorized: {
                        entry: [log("authorized"), "onAuthorizedEntry"],
                        type: "final"

                    },
                    error: {
                        entry: [log("authorized"), "onAuthorizedEntry"],
                        type: "final"

                    }
                },


            },
         
            authorized: {
                id: "authorized",
                entry: [log("authorized"), "onAuthorizedEntry"],
                invoke: {
                    src: "getUserProfile",
                    onDone: {actions: "setUserProfile"},
                    onError: {actions: ["onError", "logEventData"]},
                },
                on: {
                    LOGOUT: "logout",
                    REAUTH: "reauth",
                    REFRESH: "refreshing"
                },


            },
            refreshing: {
                entry: log('refreshing'),

                invoke: [{
                    src: "getToken",
                    onDone: {target: "authorized", actions: "setToken"},
                    onError: {target: "unauthorized", actions: ["onError", "logEventData"]},
                }
                ]

            },
            logout: {
                entry: log('logout'),

                invoke: {
                    src: "performLogout",
                    onDone: {target: "unauthorized"},
                    onError: {target: "unauthorized", actions: "onError"},
                },
            },

            error: {
                entry: ["onError", "logEventData"],
            }

        },
    },
    {

        // services: {
        //     ['login-service']: (context,event) =>context.loginService 
        // },
        actions: {
            // assignLoginService:assign({
            //     loginService:(context) => spawn(loginMachine)
            // }),
            logEventData: {
                type: 'xstate.log',
                label: 'Finish label',
                expr: (context: any, event: any) => event.data
            },
            onAuthorizedEntry: async (ctx, event) => {


            },
            setToken: assign((ctx: any, event: any) => ({
                token: {
                    id_token: event.data.idToken,
                    access_token: event.data.access_token,
                    refresh_token: event.data.refresh_token,
                },
                idToken: event.data.idToken,
                mfaToken: event.data.mfaToken
            })),

           
            resetUser: assign((ctx: any, event: any) => ({
                user: undefined,
                idToken: undefined
            })),
            setLoginResponse: assign((ctx: any, event: any) => ({
                user: event.data?.user,
                token: event.data?.token,
            })),
            setUserProfile: assign((ctx: any, event: any) => ({
                user: event.data.user
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
export type LoginMachine = typeof loginMachine;


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
export type LoginService = InterpreterFrom<LoginMachine>;