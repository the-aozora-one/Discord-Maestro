import { Command } from '../@types/command'
import { Music } from './music'
import { Ping } from './ping'
import { Recommend } from './recommend'

export const COMMANDS: Command[] = [
    Ping,
    Music,
    Recommend,
]