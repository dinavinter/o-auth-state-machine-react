import {isEmpty, omit} from "lodash/fp";
import {dataMachine} from "./dataMachine";
import {httpClient} from "../utils/asyncUtils";
import {backendPort} from "../utils/portUtils";
import {requestMachine, RequestMachineContext, RequestMachineEvents} from "./request";
import {AxiosRequestConfig} from "axios";
import {AuthMachine} from "./authMachine";
import {createMachine, Machine, actions} from "xstate";
import {Action} from "./flowMachine";

const {assign, send} = actions;

type ApiRequest = { href: string, method?: string, params?: any } & Partial<AxiosRequestConfig>;

const apiService = async (ctx: RequestMachineContext<ApiRequest>, event: any) => {
    const resp = await httpClient.get(ctx.request!.href, {
        params: ctx.request!.params,
        ...ctx.request as Partial<AxiosRequestConfig>
    });
    return resp.data;
}


export const apiMachine= requestMachine<ApiRequest>("api").withConfig({

    services: {
        execute: apiService
    },
});

// const sendEvents = assign({
//     events: (context, event) => {
//         return event.events?.actions?.filter(a => a.class === "event").reduce((a, v) => ({
//             ...a,
//             [v.name]: v.properties
//         }), {});
//
//     }
// });

// const transition = send({
//     to: (context, event) => event.data.transition.to,
//     type: (context, event) => event.data.transition.type
// });


export const dispatcherMachine = createMachine({
    context:{
        
    },
    meta:{
        flow_id: 'progressive-profiling',
        basePath: `/interactions/progressive-profiling/v1`,
        href: ( path: string) => `/v1/workflows/progressive-profiling${path && `/${path}`}`,
        // activity: ( id: string) => `/v1/workflows/progressive-profiling${path && `/${path}`}`,

        links: {
            self: `/interactions/progressive-profiling/v1`,
            dispatch: `dispatch`,
            authorization: '/oauth/authorize'
        } 
    },
    states: {
        evaluate: {
            
        },

        screen_set: {
            invoke: {
                id: 'screen_set',
                src: 'screen_set'
            },

            on: {
                '*': 'sendToParent'
            }
        },
        transition_api: {
            invoke: {
                id: 'transition_api',
                src: 'transition_api',
                onDone: 'evaluateTransitionResponse'
            }
        },
        event_api: {
            invoke: {
                id: 'event_api',
                src: 'event_api'
            }
        }
    },
}, {
    actions: {
        evaluateTransitionResponse: (ctx, e) => {
            const transition = e.data?.transition;
            if (!transition) return;
            send(transition?.event, transition.options);
        },
        sendToParent: (ctx, e, {action}) => {
            send(action.event)
        }
    }
});


export const evaluateMachine = createMachine({
    context: {
        dispatcherMachine: dispatcherMachine
    },


})
