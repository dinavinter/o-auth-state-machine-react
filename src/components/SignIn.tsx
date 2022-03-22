import React from "react";
import {RouteComponentProps, useNavigate} from "@reach/router"

import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import Typography from "@material-ui/core/Typography";
import {makeStyles} from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import {useForm} from "react-hook-form";
import FacebookIcon from "@material-ui/icons/Facebook";
import LinkedInIcon from "@material-ui/icons/LinkedIn";
import TwitterIcon from "@material-ui/icons/Twitter";
import {
    yahooGigyaLogin,
    linkedinGigyaLogin,
    facebookGigyaLogin,
    twitterGigyaLogin, googleGigyaLogin, opublicConnectGigyaLogin, oconnectGigyaLogin,
} from "../gigya/gigyaWebSDK";
import gigyaWebSDK from "../gigya/gigyaWebSDK";
// import {useService} from "@xstate/react";
// import {socialLogin} from "../gigya/gigyaAuthMachine";
import {asEffect, useActor, useSelector} from "@xstate/react";
import {Interpreter} from "xstate";
import {AuthService} from "../machines/authMachine";
import {ErrorOutlined} from "@material-ui/icons";

const useStyles = makeStyles((theme) => ({
    paper: {
        marginTop: theme.spacing(8),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        margin: theme.spacing(1)
    },
    paperRow: {
        marginTop: theme.spacing(8),
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        margin: theme.spacing(1)
    },
    avatar: {
        margin: theme.spacing(1),
        backgroundColor: theme.palette.secondary.main,
    },
    form: {
        width: "100%", // Fix IE 11 issue.
        marginTop: theme.spacing(1),
    },
    submit: {
        margin: theme.spacing(2, 0, 2),
    },
}));

export interface SignInProps extends RouteComponentProps {
    authService: AuthService;
}

const loginServiceSelector = (state: any) => state.context;
export default function SignIn({authService}: SignInProps) {
    const classes = useStyles();
    const {register, handleSubmit, formState: {errors}} = useForm();
    const {message} = useSelector(authService, loginServiceSelector);

    // const {loginService} = useSelector(authService, loginServiceSelector);
    const loginService = authService;

    // const [ state,sendAuth] = useActor(authService.state);
    // The normal Gigya account login process makes use of
    // the react-hook-form library
    const handleLogin = async (data: any) => {
        const params = {
            email: data.email,
            password: data.password,
        };
        loginService.send({type: "SUBMIT", ...params})

    };
    const handleRegister = async () => {
       
        loginService.send({type: "SIGNUP"})

    };

    const handleFacebookGigyaLogin = () => {
        loginService.send({type: 'SOCIAL', provider: "facebook"});
    };


    const handleLinkedinGigyaLogin = () => {
        loginService.send({type: 'SOCIAL', provider: "linkedin"});
    };


    const handleGoogleLogin = () => {
        loginService.send({type: 'SOCIAL', provider: "google"});
    };

    const handleOConnectLogin = async () => {
        loginService.send({type: 'SOCIAL', provider: "oidc-oconnect"});
    };

    const handleOPublicConnectGigyaLogin = () => {
        loginService.send({type: 'SOCIAL', provider: "oidc-coolconnect"});
    };

    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline/>
                <div className={classes.paper}>
                    <Avatar className={classes.avatar}>
                        <LockOutlinedIcon/>
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        Sign in
                    </Typography>
                    <form
                        className={classes.form}
                        noValidate
                        onSubmit={handleSubmit(handleLogin)}
                    >
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            autoComplete="email"
                            autoFocus
                            {...register("email", {required: true})}
                        />
                        {errors && errors.email && <span>Please enter an Email address</span>}
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            {...register("password", {required: true})}
                        />
                        {errors && errors.password && <span>Please enter a password</span>}
                        {message &&  <span><ErrorOutlined /> {message}</span>}
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            className={classes.submit}
                        >
                            Sign In
                        </Button>

                    
                    </form>


                </div>
          
            {/*  <Button
                startIcon={<FacebookIcon/>}
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                className={classes.submit}
                onClick={handleFacebookGigyaLogin}
            >
                Sign In With Facebook
            </Button>
            <Button
                startIcon={<TwitterIcon/>}
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                className={classes.submit}
                onClick={handleGoogleLogin}
            >
                Sign In With Google
            </Button>
            <Button
                startIcon={<LinkedInIcon/>}
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                className={classes.submit}
                onClick={handleLinkedinGigyaLogin}
            >
                Sign In With LinkedIn
            </Button>*/}
            <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                className={classes.submit}
                onClick={handleOPublicConnectGigyaLogin}
            >
                Sign In With Something Good
            </Button>

            <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                className={classes.submit}
                onClick={handleOConnectLogin}
            >
                Sign In With OConnect
            </Button>
            <Grid container justify="flex-start">
                <Grid item>
                    <Link  onClick={handleRegister} variant="body2">
                        {"Don't have an account? Sign Up"}
                    </Link>
                </Grid>
            </Grid>


        </Container>
    );
}
