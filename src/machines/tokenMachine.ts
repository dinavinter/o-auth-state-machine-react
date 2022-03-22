import { createModel } from 'xstate/lib/model';

const tokenModel = createModel({
    token: 'Someone',
    age: 0
});


export interface TokenMachineSchema {
    states: {
        idle: {};
        token: {
            reauth: {};
        };
       
    
    };
}