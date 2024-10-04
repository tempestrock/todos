import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  InitiateAuthCommandInput,
  RespondToAuthChallengeCommand,
  RespondToAuthChallengeCommandInput,
} from '@aws-sdk/client-cognito-identity-provider'

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION })

export const signIn = async (username: string, password: string) => {
  const params: InitiateAuthCommandInput = {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: process.env.COGNITO_CLIENT_ID!,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  }

  const command = new InitiateAuthCommand(params)
  const response = await cognitoClient.send(command)
  return response // Contains tokens or challenge
}

export const completeNewPassword = async (username: string, newPassword: string, sessionToken: string) => {
  const params: RespondToAuthChallengeCommandInput = {
    ChallengeName: 'NEW_PASSWORD_REQUIRED',
    ClientId: process.env.COGNITO_CLIENT_ID!,
    ChallengeResponses: {
      USERNAME: username,
      NEW_PASSWORD: newPassword,
    },
    Session: sessionToken,
  }

  const command = new RespondToAuthChallengeCommand(params)
  const response = await cognitoClient.send(command)
  return response // Contains tokens
}
