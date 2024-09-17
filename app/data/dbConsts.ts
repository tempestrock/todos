export const TABLE_NAME_TASKS = 'Tasks'
export const TABLE_NAME_TASKLIST_METADATA = 'TaskListMetadata'
export const TABLE_NAME_USERS = 'Users'

export const getCurrentEnvName = (): string => process.env.ENV_NAME ?? 'dev'

export const getTableName = (baseTableName: string) => `${baseTableName}-${getCurrentEnvName()}`
