import React, { useState } from "react";
import gigyaWebSDK from "../gigya/gigyaWebSDK";
 import Avatar from "@material-ui/core/Avatar";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import { useForm } from "react-hook-form";
import {Redirect, RouteComponentProps} from "@reach/router";
import {AuthService} from "../machines/authMachine";
import {history} from "../utils/historyUtils";
import {useActor, useSelector} from "@xstate/react";
import {AnyState} from "xstate";
import JsonView from "./JsonTreeViewer";
import {Paper, Typography} from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
    width: theme.spacing(12),
    height: theme.spacing(12),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  form: {
    // width: "100%", // Fix IE 11 issue.
    marginTop: theme.spacing(1),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
}));

 
export interface SessionProps {
  authService: AuthService;

}
 

const jwtSelector=(state:AnyState)=>state?.context;
function SessionInfo({authService}: SessionProps) {
  const classes = useStyles();
  const {idToken, mfaToken} = useSelector(authService, jwtSelector) ||{};
  
   

  return (
      <Paper className={classes.paper} >
      <Paper className={classes.paper} >
        <Typography component="h2" variant="h6" color="primary" gutterBottom>
          MFA Token
        </Typography>
        {mfaToken &&  <JsonView data={mfaToken} />}  
      </Paper>
        
        <Paper className={classes.paper} >
        <Typography component="h2" variant="h6" color="primary" gutterBottom>
          Id Token
        </Typography>
        {idToken && idToken.details && <JsonView data={idToken.details} />}  
      </Paper>
      </Paper>
  );
}
function decodeJwt(token?:string) {

  return token && token.split && JSON.parse(atob(token.split('.')[1]));

}

export default SessionInfo;
