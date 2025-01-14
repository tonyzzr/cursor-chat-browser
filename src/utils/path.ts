import os from 'os'
import path from 'path'

export const expandTildePath = (inputPath: string): string => {
  const homePath = os.homedir()
  
  // Handle paths that start with ~/
  if (inputPath.startsWith('~/')) {
    return path.join(homePath, inputPath.slice(2))
  }
  
  // Handle paths that should start with the home directory but don't have ~/
  if (inputPath.includes('Library/Application Support')) {
    return path.join(homePath, inputPath)
  }
  
  return inputPath
} 