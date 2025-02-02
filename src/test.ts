import axios from 'axios';

async function prepareAuthCookies(): Promise<string[]> {
    const response = await axios.post(
      'https://auth.riotgames.com/api/v1/authorization',
      {
        client_id: 'play-valorant-web-prod',
        nonce: '1',
        redirect_uri: 'https://playvalorant.com/opt_in',
        response_type: 'token id_token',
        scope: 'account openid',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  
    const cookies = response.headers['set-cookie'] || [];
    console.log('Cookies Returned by Auth API:', cookies);
  
    if (cookies.length === 0) {
      throw new Error('No cookies returned from the server.');
    }
  
    return cookies;
  }
  
  
  async function reauthenticateWithAuthRequest(
    cookies: string[],
    username: string,
    password: string,
    captchaToken?: string // Optional hCaptcha token
  ): Promise<{ accessToken: string; idToken: string }> {
    try {
      const requestBody: any = {
        type: 'auth',
        language: 'en_US',
        remember: true,
        username: username,
        password: password,
        country: 'JP', // Add country field for region-specific handling
      };
  
      if (captchaToken) {
        requestBody.captcha = captchaToken; // Include CAPTCHA token if provided
      }
  
      const response = await axios.put(
        'https://auth.riotgames.com/api/v1/authorization',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookies.join('; '), // Pass all cookies received from the first step
            'User-Agent': 'RiotClient/64.0.1',
          },
        }
      );
  
      console.log('Auth Request Response:', response.data);
  
      if (response.data.type === 'auth_failure') {
        console.error('Authentication failed:', response.data.error);
        throw new Error('Authentication failed: Invalid credentials or additional verification required.');
      }
  
      // Parse the redirect URI for access and ID tokens
      const uri = response.data.response?.parameters?.uri;
      if (!uri) {
        throw new Error('Failed to retrieve redirect URI from response.');
      }
  
      const accessTokenMatch = uri.match(/access_token=([^&]+)/);
      const idTokenMatch = uri.match(/id_token=([^&]+)/);
  
      if (!accessTokenMatch || !idTokenMatch) {
        throw new Error('Failed to extract tokens from redirect URI.');
      }
  
      return {
        accessToken: accessTokenMatch[1],
        idToken: idTokenMatch[1],
      };
    } catch (error: any) {
      console.error('Full error response:', error.response?.data || error.message);
      throw new Error('Reauthentication failed.');
    }
  }
  
  
  
  

  async function getEntitlementToken(accessToken: string): Promise<string> {
    const response = await axios.post(
      'https://entitlements.auth.riotgames.com/api/token/v1',
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  
    if (!response.data || !response.data.entitlements_token) {
      throw new Error('Failed to retrieve entitlement token.');
    }
  
    return response.data.entitlements_token;
  }

  async function main() {
    const username = 'ARMqt1100'; // Replace with your Riot username
    const password = '8zFvyqLQE7s1o'; // Replace with your Riot password
    const captchaToken = ''; // Replace with a valid hCaptcha token if required
  
    try {
      console.log('Step 1: Fetching cookies...');
      const cookies = await prepareAuthCookies();
      console.log('Cookies fetched successfully:', cookies);
  
      // Step 2: Perform the authentication request
      console.log('Step 2: Reauthenticating with Auth Request...');
      const { accessToken, idToken } = await reauthenticateWithAuthRequest(
        cookies,
        username,
        password,
        captchaToken
      );
  
      console.log('Access Token:', accessToken);
      console.log('ID Token:', idToken);
  
      // Step 3: Fetch entitlement token
      console.log('Step 3: Fetching entitlement token...');
      const entitlementToken = await getEntitlementToken(accessToken);
      console.log('Entitlement Token:', entitlementToken);
    } catch (error: any) {
      console.error('Error:', error.message);
    }
  }
  
  main();
  