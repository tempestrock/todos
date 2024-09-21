/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js'

const userPool = new CognitoUserPool({
  UserPoolId: process.env.COGNITO_USER_POOL_ID!,
  ClientId: process.env.COGNITO_CLIENT_ID!,
})

export const signUp = (username: string, password: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    userPool.signUp(username, password, [], [], (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

export const signIn = (username: string, password: string): Promise<any> => {
  const authenticationDetails = new AuthenticationDetails({
    Username: username,
    Password: password,
  })

  const cognitoUser = new CognitoUser({
    Username: username,
    Pool: userPool,
  })

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        resolve(result)
      },
      onFailure: (err) => {
        reject(err)
      },
      newPasswordRequired: (_userAttributes, _requiredAttributes) => {
        resolve({ challengeName: 'NEW_PASSWORD_REQUIRED' })
      },
    })
  })
}

export const completeNewPassword = (username: string, password: string, newPassword: string): Promise<any> => {
  const authenticationDetails = new AuthenticationDetails({
    Username: username,
    Password: password,
  })

  const cognitoUser = new CognitoUser({
    Username: username,
    Pool: userPool,
  })

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        // This should not happen in this flow.
        resolve(result)
      },
      onFailure: (err) => {
        reject(err)
      },
      newPasswordRequired: (_userAttributes, _requiredAttributes) => {
        cognitoUser.completeNewPasswordChallenge(
          newPassword,
          {},
          {
            onSuccess: (result) => {
              resolve(result)
            },
            onFailure: (err) => {
              reject(err)
            },
          }
        )
      },
    })
  })
}

export const signOut = (): void => {
  const cognitoUser = userPool.getCurrentUser()
  if (cognitoUser) {
    cognitoUser.signOut()
  }
}

export const getCurrentUser = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser()
    if (!cognitoUser) {
      reject(new Error('No user found'))
      return
    }

    cognitoUser.getSession((err: any, session: any) => {
      if (err) {
        reject(err)
        return
      }
      cognitoUser.getUserAttributes((err, attributes) => {
        if (err) {
          reject(err)
        } else {
          resolve({ cognitoUser, session, attributes })
        }
      })
    })
  })
}
