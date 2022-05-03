// src/mocks/handlers.js
import { rest } from 'msw'
import collectConsent from "./activities/collect-consent";

const signalsMap={
    ["after-submit"] : 'collect-consent'
}

 


export const handlers = [
    rest.post('/signals/:signal', (req, res, ctx) => {

        const { signal } = req.params
        return res(
            ctx.json({
                next: `/activities/${signalsMap[signal]}`,
            })
        )

    }),

    
    
    
    rest.get('/activities/:activity', (req, res, ctx) => {


        const { activity } = req.params

        // If authenticated, return a mocked user details
        return res(
            ctx.status(200),
            ctx.json(collectConsent),
        )
    }),
]