import App from 'next/app'; // @server-only
import type { AppProps, AppContext } from 'next/app';
import Head from 'next/head';
import { SWRConfig } from 'swr';
import { authenticate } from 'modules/server/auth'; // @server-only
import { getPrivateUser } from 'modules/server/users'; // @server-only
import env from 'modules/client/env';
import { UserContext, useUserState } from 'modules/client/users';
import type { PrivateUser } from 'modules/client/users';
import * as MSPFA from 'modules/client/MSPFA'; // @client-only
import type { PageRequest } from 'modules/server/pages';
import 'styles/global.scss';

(global as any).MSPFA = MSPFA; // @client-only

export type MyAppPageProps = {
	readonly [key: string]: any,
	env: Partial<typeof process.env>,
	user?: PrivateUser
};

const MyApp = ({
	Component,
	// Any re-renders will set all of `pageProps`'s properties to `undefined`.
	pageProps: {
		env: envProp,
		user: userProp,
		...pageProps
	}
}: Omit<AppProps, 'pageProps'> & {
	pageProps: MyAppPageProps
}) => {
	Object.assign(env, envProp);
	
	const user = useUserState(userProp);
	
	return (
		<>
			<Head>
				<title>MS Paint Fan Adventures</title>
				<meta name="description" content="Hello, welcome to the bath house" />
				<meta name="author" content="MS Paint Fan Adventures" />
				<meta property="og:type" content="website" />
				<meta property="og:site_name" content="MS Paint Fan Adventures" />
				<meta property="og:description" content="Hello, welcome to the bath house" />
				<meta property="og:title" content="MS Paint Fan Adventures" />
				<meta property="og:image" content="/images/icon.png" />
				<link rel="icon" href="/images/icon.png" /* Perfectly generic icon by heyitskane */ />
			</Head>
			<SWRConfig
				value={{
					revalidateOnMount: true,
					revalidateOnFocus: false,
					revalidateOnReconnect: false
				}}
			>
				<UserContext.Provider value={user}>
					<Component {...pageProps} />
				</UserContext.Provider>
			</SWRConfig>
		</>
	);
};

// @server-only {
/** This runs server-side on every page request (only for initial requests by the browser, not by the Next router). */
MyApp.getInitialProps = async (appContext: AppContext) => {
	const appProps = await App.getInitialProps(appContext);
	const { pageProps } = appProps as (
		typeof appProps
		& { pageProps: MyAppPageProps }
	);
	
	// These environment variables will be sent to the client.
	pageProps.env = {
		HCAPTCHA_SITE_KEY: process.env.HCAPTCHA_SITE_KEY,
		GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
		DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID
	};
	
	const { req, res } = appContext.ctx as (
		typeof appContext.ctx
		& { req?: PageRequest }
	);
	if (req && res) {
		req.pageProps = pageProps;
		
		const { user } = await authenticate(req, res);
		if (user) {
			// This exposes `pageProps` to any page's `getServerSideProps` method.
			req.user = user;
			
			pageProps.user = getPrivateUser(user);
		}
	}
	
	return appProps;
};
// @server-only }

export default MyApp;