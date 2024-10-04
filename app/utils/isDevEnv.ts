import { ENV_DEV, ENV_PROD } from '~/types/consts'

export const isDevEnv = (): boolean => process.env.NODE_ENV && process.env.NODE_ENV === ENV_DEV
export const isProdEnv = (): boolean => process.env.NODE_ENV && process.env.NODE_ENV === ENV_PROD
